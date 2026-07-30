"use strict";

const rateLimit = require("express-rate-limit");

const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много заявок. Попробуйте позже." }
});

module.exports = { createOrderLimiter };
