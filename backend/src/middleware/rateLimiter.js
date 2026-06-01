const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, message),
  });

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX) || 100,
  'Too many requests. Please try again after 15 minutes.'
);

// Stricter limiter for auth routes
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many login attempts. Please try again after 15 minutes.'
);

module.exports = { apiLimiter, authLimiter };
