const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @route GET /api/v1/admin/users  (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return sendPaginated(res, 'Users retrieved', users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/admin/users/:id  (admin)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User retrieved', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @route PATCH /api/v1/admin/users/:id  (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    // Prevent updating sensitive fields
    const { password, refreshToken, ...allowedUpdates } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) return sendError(res, 404, 'User not found');
    logger.info(`User ${req.params.id} updated by admin ${req.user._id}`);
    return sendSuccess(res, 200, 'User updated', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @route DELETE /api/v1/admin/users/:id  (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'Admins cannot delete their own account');
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    // Delete all user tasks
    await Task.deleteMany({ owner: req.params.id });
    logger.info(`User ${req.params.id} deleted by admin ${req.user._id}`);
    return sendSuccess(res, 200, 'User and their tasks deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/admin/stats
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, adminCount, activeUsers, totalTasks, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return sendSuccess(res, 200, 'Admin stats', {
      users: { total: totalUsers, admins: adminCount, active: activeUsers },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getAdminStats };
