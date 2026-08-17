"use strict";

const rateLimit = require("express-rate-limit");

const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много заявок. Попробуйте позже." }
});

const createLeadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много заявок. Попробуйте позже." }
});

function createLoginLimiter(prefix) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${prefix}:${req.ip}`,
    message: { error: "Слишком много попыток входа. Попробуйте позже." }
  });
}

const authLoginLimiter = createLoginLimiter("auth");
const adminLoginLimiter = createLoginLimiter("admin");

module.exports = { createOrderLimiter, createLeadLimiter, authLoginLimiter, adminLoginLimiter };
