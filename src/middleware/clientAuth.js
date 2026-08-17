"use strict";

const jwt = require("jsonwebtoken");
const db = require("../db");
const config = require("../config");

function clientAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const client = db.prepare("SELECT is_active FROM clients WHERE id = ?").get(decoded.clientId);
    if (!client || !client.is_active) {
      return res.status(401).json({ error: "Client deactivated" });
    }
    req.clientId = decoded.clientId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = clientAuth;
