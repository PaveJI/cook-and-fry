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
    const { status, search, company, date, date_from, limit = 50, offset = 0 } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (status) {
      where += " AND status = ?";
      params.push(status);
    }
    if (company) {
      where += " AND company_name = ?";
      params.push(company);
    }
    if (date) {
      where += " AND delivery_date = ?";
      params.push(date);
    }
    if (date_from) {
      where += " AND delivery_date >= ?";
      params.push(date_from);
    }
    if (search) {
      where += " AND (customer_name LIKE ? OR customer_phone LIKE ? OR order_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countSql = `SELECT COUNT(*) as total FROM orders ${where}`;
    const { total } = db.prepare(countSql).get(...params);

    const ordersSql = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const orders = db.prepare(ordersSql).all(...params, Number(limit), Number(offset));

    res.json({ orders, total });
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
    const rows = db.prepare("SELECT company_name FROM customers ORDER BY company_name").all();
    res.json({ companies: rows.map((r) => r.company_name) });
  } catch (err) {
    next(err);
  }
});

router.get("/customers", (req, res, next) => {
  try {
    const customers = db.prepare("SELECT * FROM customers ORDER BY company_name").all();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
});

router.post("/customers", (req, res, next) => {
  try {
    const { company_name, address, customer_phone } = req.body;
    if (!company_name || !String(company_name).trim()) {
      return res.status(400).json({ error: "Укажите название компании" });
    }
    const stmt = db.prepare("INSERT INTO customers (company_name, address, customer_phone) VALUES (?, ?, ?)");
    const result = stmt.run(company_name.trim(), address || null, customer_phone || null);
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Компания с таким названием уже существует" });
    }
    next(err);
  }
});

router.patch("/customers/:id", (req, res, next) => {
  try {
    const { company_name, address, customer_phone } = req.body;
    if (!company_name || !String(company_name).trim()) {
      return res.status(400).json({ error: "Укажите название компании" });
    }
    const stmt = db.prepare("UPDATE customers SET company_name = ?, address = ?, customer_phone = ? WHERE id = ?");
    const result = stmt.run(company_name.trim(), address || null, customer_phone || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Заказчик не найден" });
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
    res.json({ success: true, customer });
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "Компания с таким названием уже существует" });
    }
    next(err);
  }
});

router.delete("/customers/:id", (req, res, next) => {
  try {
    const stmt = db.prepare("DELETE FROM customers WHERE id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Заказчик не найден" });
    res.json({ success: true });
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
