const Task = require('../models/Task');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @route GET /api/v1/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      archived = false,
    } = req.query;

    // Build query
    const query = {
      owner: req.user._id,
      isArchived: archived === 'true',
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('owner', 'name email'),
      Task.countDocuments(query),
    ]);

    return sendPaginated(res, 'Tasks retrieved', tasks, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/tasks/:id
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user.role === 'admin' ? undefined : req.user._id,
    }).populate('owner', 'name email');

    if (!task) return sendError(res, 404, 'Task not found');
    return sendSuccess(res, 200, 'Task retrieved', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, owner: req.user._id });
    logger.info(`Task created: ${task._id} by user: ${req.user._id}`);
    return sendSuccess(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @route PUT /api/v1/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.owner = req.user._id;

    const task = await Task.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email');

    if (!task) return sendError(res, 404, 'Task not found');
    return sendSuccess(res, 200, 'Task updated successfully', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @route DELETE /api/v1/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.owner = req.user._id;

    const task = await Task.findOneAndDelete(filter);
    if (!task) return sendError(res, 404, 'Task not found');

    logger.info(`Task deleted: ${req.params.id}`);
    return sendSuccess(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/tasks/stats  (admin only)
 */
const getStats = async (req, res, next) => {
  try {
    const matchStage = req.user.role === 'admin' ? {} : { owner: req.user._id };

    const stats = await Task.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
        },
      },
    ]);

    return sendSuccess(res, 200, 'Stats retrieved', stats[0] || {
      total: 0, todo: 0, inProgress: 0, done: 0, high: 0, medium: 0, low: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/admin/tasks  (admin only - all tasks)
 */
const getAllTasksAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const query = {};
    if (userId) query.owner = userId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)).populate('owner', 'name email role'),
      Task.countDocuments(query),
    ]);

    return sendPaginated(res, 'All tasks retrieved', tasks, page, limit, total);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getStats, getAllTasksAdmin };
