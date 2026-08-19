"use strict";

const express = require("express");
const db = require("../db");
const { createLeadLimiter } = require("../middleware/rateLimiter");
const { notify: hubNotify } = require("../utils/hub-client.cjs");
const { notifyNewLead } = require("../notifications");

const router = express.Router();

function formatLead(lead) {
  return [
    `📩 Новая заявка с лендинга`,
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    `🏢 ${lead.company || "—"}`,
    `🌐 Источник: ${lead.source}`
  ].join("\n");
}

router.post("/", createLeadLimiter, (req, res, next) => {
  try {
    const { name, phone, company, source = "landing" } = req.body;

    // Honeypot check
    if (req.body.website) {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({ error: "Укажите имя и телефон" });
    }

    const stmt = db.prepare(`
      INSERT INTO leads (name, phone, company, source)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name.trim(), phone.trim(), company ? company.trim() : null, source);
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(result.lastInsertRowid);

    hubNotify("info", formatLead(lead)).catch(console.error);
    notifyNewLead(lead).catch(console.error);

    res.status(201).json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
