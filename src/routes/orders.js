"use strict";

const express = require("express");
const db = require("../db");
const { createOrderLimiter } = require("../middleware/rateLimiter");
const { notifyNewOrder } = require("../notifications");

const router = express.Router();

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LUNCH-${date}-${random}`;
}

router.post("/", createOrderLimiter, (req, res, next) => {
  try {
    const {
      company_name,
      delivery_date,
      customer_name,
      customer_phone,
      customer_email,
      dish1,
      dish2,
      dish3,
      drink,
      bread,
      comment
    } = req.body;

    // Honeypot check
    if (req.body.website) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const required = [company_name, delivery_date, customer_name, customer_phone, dish1, dish2, dish3];
    if (required.some((field) => !field || !String(field).trim())) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    const orderNumber = generateOrderNumber();
    const stmt = db.prepare(`
      INSERT INTO orders (
        order_number, company_name, delivery_date, customer_name, customer_phone,
        customer_email, dish1, dish2, dish3, drink, bread, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderNumber,
      company_name,
      delivery_date,
      customer_name,
      customer_phone,
      customer_email || null,
      dish1,
      dish2,
      dish3,
      drink || null,
      bread || null,
      comment || null
    );

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);

    notifyNewOrder(order).catch(console.error);

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

router.get("/companies", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT DISTINCT company_name FROM orders ORDER BY company_name").all();
    res.json({ companies: rows.map((r) => r.company_name) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Заявка не найдена" });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
