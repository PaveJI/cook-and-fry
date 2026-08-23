"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const healthRouter = require("./routes/health");
const ordersRouter = require("./routes/orders");
const leadsRouter = require("./routes/leads");
const authRouter = require("./routes/auth");
const clientRouter = require("./routes/client");
const adminRouter = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");
const { requestLogger, clientErrorLogger } = require("./middleware/logger");
const config = require("./config");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));
const isDev = process.env.NODE_ENV !== "production";
const allowedOrigins = [
  config.baseUrl,
  "https://naobedvbufet.ru",
  "http://naobedvbufet.ru",
  "https://naobedvbufet.shop",
  "http://naobedvbufet.shop",
  ...(isDev ? [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ] : []),
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : [])
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Разрешаем любые временные Cloudflare Tunnel URL
  if (/\.trycloudflare\.com$/i.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true
}));
app.use((req, res, next) => {
  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  next();
});
app.use(express.json());
app.use(requestLogger);

// Главная страница — SEO-лендинг, а не форма заказа
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "landing.html"));
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Pretty routes for customer-facing pages
app.get("/admin", (req, res) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.sendFile(path.join(__dirname, "../frontend", "admin.html"));
});
app.get("/pwa", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "pwa.html"));
});
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "privacy.html"));
});

app.use("/api/health", healthRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/auth", authRouter);
app.use("/api/client", clientRouter);
app.use("/api/admin", adminRouter);

app.post("/api/log", clientErrorLogger);

app.use(errorHandler);

module.exports = app;
