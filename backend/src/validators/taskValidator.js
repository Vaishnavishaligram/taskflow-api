const { body, query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');
const mongoose = require('mongoose');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
};

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be: todo, in-progress, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be: low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date')
    .custom((val) => new Date(val) > new Date()).withMessage('Due date must be in the future'),
  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('Tags must be an array with max 10 items'),
  body('tags.*')
    .optional()
    .isString().withMessage('Each tag must be a string')
    .trim()
    .isLength({ min: 1, max: 30 }).withMessage('Each tag must be 1-30 characters'),
  handleValidation,
];

const updateTaskValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Too many tags'),
  handleValidation,
];

const objectIdValidator = (paramName = 'id') => [
  param(paramName).custom((val) => {
    if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('Invalid ID format');
    return true;
  }),
  handleValidation,
];

module.exports = { createTaskValidator, updateTaskValidator, objectIdValidator };
