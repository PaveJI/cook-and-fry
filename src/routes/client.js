"use strict";

const express = require("express");
const db = require("../db");
const clientAuth = require("../middleware/clientAuth");

const router = express.Router();
router.use(clientAuth);

router.get("/orders", (req, res, next) => {
  try {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.clientId);
    if (!client) return res.status(404).json({ error: "Клиент не найден" });

    const orders = db.prepare(`
      SELECT * FROM orders WHERE client_phone = ? ORDER BY created_at DESC
    `).all(client.phone);

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
