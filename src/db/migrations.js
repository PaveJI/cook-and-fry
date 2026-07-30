"use strict";

const TABLES = {
  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      dish1 TEXT NOT NULL,
      dish2 TEXT NOT NULL,
      dish3 TEXT NOT NULL,
      drink TEXT,
      bread TEXT,
      comment TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'confirmed', 'preparing', 'delivered', 'cancelled')),
      price INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  clients: `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  invites: `
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  admins: `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `,
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT UNIQUE NOT NULL,
      address TEXT,
      customer_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
};

function migrate(db) {
  Object.values(TABLES).forEach((sql) => {
    db.exec(sql);
  });
}

module.exports = { migrate };
