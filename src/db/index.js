"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { migrate } = require("./migrations");
const config = require("../config");

const dbPath = path.isAbsolute(config.dbPath)
  ? config.dbPath
  : path.join(__dirname, "../..", config.dbPath);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

migrate(db);

module.exports = db;
