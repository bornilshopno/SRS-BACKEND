// middlewares/rateLimiter.js

import rateLimit from "express-rate-limit";

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: {
    success: false,
    message: "Too many requests. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});