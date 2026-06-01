const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all users (admin)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-refreshToken')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  sendPaginated(res, 'Users fetched', users, page, limit, total);
});

/**
 * @desc    Get user by ID (admin)
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  sendSuccess(res, 'User fetched', user);
});

/**
 * @desc    Update user role or status (admin)
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  // Prevent admin from downgrading themselves
  if (req.params.id === req.user._id.toString() && role === 'user') {
    return sendError(res, 'Cannot downgrade your own admin role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isActive },
    { new: true, runValidators: true }
  );

  if (!user) return sendError(res, 'User not found', 404);

  sendSuccess(res, 'User updated', user);
});

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 'Cannot delete yourself', 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);

  // Delete all tasks by this user
  await Task.deleteMany({ createdBy: req.params.id });

  sendSuccess(res, 'User and associated tasks deleted');
});

/**
 * @desc    Dashboard stats (admin)
 * @route   GET /api/v1/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalTasks, activeUsers, tasksByStatus] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    User.countDocuments({ isActive: true }),
    Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  sendSuccess(res, 'Dashboard stats', {
    users: { total: totalUsers, active: activeUsers },
    tasks: { total: totalTasks, byStatus: tasksByStatus },
  });
});

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getDashboardStats };
