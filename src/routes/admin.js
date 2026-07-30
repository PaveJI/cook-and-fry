"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const adminAuth = require("../middleware/adminAuth");
const config = require("../config");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (username === config.adminUsername && config.adminPasswordHash) {
      const valid = await bcrypt.compare(password, config.adminPasswordHash);
      if (valid) {
        return res.json({ success: true, token: config.adminToken });
      }
    }

    res.status(401).json({ error: "Неверный логин или пароль" });
  } catch (err) {
    next(err);
  }
});

router.use(adminAuth);

router.get("/orders", (req, res, next) => {
  try {
    const { status, search, company, date, limit = 50, offset = 0 } = req.query;
    let sql = "SELECT * FROM orders WHERE 1=1";
    const params = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (company) {
      sql += " AND company_name = ?";
      params.push(company);
    }
    if (date) {
      sql += " AND delivery_date = ?";
      params.push(date);
    }
    if (search) {
      sql += " AND (customer_name LIKE ? OR customer_phone LIKE ? OR order_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY delivery_date ASC, created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const orders = db.prepare(sql).all(...params);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:id/status", (req, res, next) => {
  try {
    const { status, comment, price } = req.body;
    const stmt = db.prepare(`
      UPDATE orders
      SET status = ?, comment = ?, price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, comment || null, price || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", (req, res, next) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
    const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get().count;
    const confirmed = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'").get().count;
    const preparing = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'preparing'").get().count;
    const delivered = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;

    res.json({ total, new: newOrders, confirmed, preparing, delivered });
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

router.post("/invite", (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Укажите телефон" });

    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const stmt = db.prepare("INSERT INTO invites (code, phone) VALUES (?, ?)");
    stmt.run(code, phone);

    res.status(201).json({ success: true, invite: { code, phone } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
