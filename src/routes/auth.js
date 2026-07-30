"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const config = require("../config");

const router = express.Router();

function generateToken(clientId) {
  return jwt.sign({ clientId }, config.jwtSecret, { expiresIn: "7d" });
}

router.post("/invite", async (req, res, next) => {
  try {
    const { code, name, password } = req.body;

    if (!code || !name || !password) {
      return res.status(400).json({ error: "Заполните все поля" });
    }

    const invite = db.prepare("SELECT * FROM invites WHERE code = ?").get(code);
    if (!invite || invite.used_at) {
      return res.status(400).json({ error: "Инвайт недействителен" });
    }

    const existing = db.prepare("SELECT * FROM clients WHERE phone = ?").get(invite.phone);
    if (existing) {
      return res.status(400).json({ error: "Клиент уже зарегистрирован" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO clients (phone, name, password_hash)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(invite.phone, name, passwordHash);

    db.prepare("UPDATE invites SET used_at = CURRENT_TIMESTAMP WHERE id = ?").run(invite.id);

    const token = generateToken(result.lastInsertRowid);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Заполните телефон и пароль" });
    }

    const client = db.prepare("SELECT * FROM clients WHERE phone = ?").get(phone);
    if (!client || !client.is_active) {
      return res.status(401).json({ error: "Неверный телефон или пароль" });
    }

    const valid = await bcrypt.compare(password, client.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Неверный телефон или пароль" });
    }

    const token = generateToken(client.id);
    res.json({ success: true, token, client: { id: client.id, name: client.name, phone: client.phone } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
