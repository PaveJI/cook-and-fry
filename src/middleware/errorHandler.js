"use strict";

const { logServerError } = require("./logger");

function errorHandler(err, req, res, next) {
  logServerError(err, req);
  console.error(err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
}

module.exports = errorHandler;
