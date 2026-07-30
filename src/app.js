"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const healthRouter = require("./routes/health");
const ordersRouter = require("./routes/orders");
const authRouter = require("./routes/auth");
const clientRouter = require("./routes/client");
const adminRouter = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");
const { requestLogger, clientErrorLogger } = require("./middleware/logger");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.BASE_URL || "*" }));
app.use(express.json());
app.use(requestLogger);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/health", healthRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/auth", authRouter);
app.use("/api/client", clientRouter);
app.use("/api/admin", adminRouter);

app.post("/api/log", clientErrorLogger);

app.use(errorHandler);

module.exports = app;
