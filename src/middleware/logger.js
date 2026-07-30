"use strict";

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

const accessStream = fs.createWriteStream(path.join(LOG_DIR, "access.log"), { flags: "a" });
const clientErrorStream = fs.createWriteStream(path.join(LOG_DIR, "client-errors.log"), { flags: "a" });
const serverErrorStream = fs.createWriteStream(path.join(LOG_DIR, "server-errors.log"), { flags: "a" });

function formatLogLine(parts) {
  return `[${new Date().toISOString()}] ${parts.join(" | ")}\n`;
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "-";
    const line = formatLogLine([
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      `${duration}ms`,
      ip,
      req.headers["user-agent"] || "-"
    ]);
    accessStream.write(line);
  });
  next();
}

function clientErrorLogger(req, res) {
  const { type = "log", message = "", stack = "", url = "" } = req.body || {};
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "-";
  const line = formatLogLine([
    "CLIENT",
    type,
    url,
    message,
    stack.replace(/\n/g, " "),
    ip,
    req.headers["user-agent"] || "-"
  ]);
  clientErrorStream.write(line);
  res.status(204).end();
}

function logServerError(err, req) {
  const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "-";
  const line = formatLogLine([
    "SERVER",
    err.name || "Error",
    err.message,
    err.stack ? err.stack.replace(/\n/g, " ") : "",
    req ? `${req.method} ${req.originalUrl || req.url}` : "-",
    ip
  ]);
  serverErrorStream.write(line);
}

module.exports = {
  requestLogger,
  clientErrorLogger,
  logServerError,
  accessStream,
  clientErrorStream,
  serverErrorStream
};
