import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './env.js';

// Datenverzeichnis sicherstellen
fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'app.db');
const db = new Database(dbPath);

// Sinnvolle, sichere PRAGMAs
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    category        TEXT NOT NULL DEFAULT 'Allgemein',
    price_cents     INTEGER NOT NULL DEFAULT 0,
    sale_price_cents INTEGER,
    sizes           TEXT NOT NULL DEFAULT '[]',   -- JSON-Array
    images          TEXT NOT NULL DEFAULT '[]',   -- JSON-Array {type,src}
    stock           INTEGER NOT NULL DEFAULT 0,
    is_bestseller   INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reference     TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    email         TEXT NOT NULL,
    address       TEXT NOT NULL DEFAULT '',
    items         TEXT NOT NULL DEFAULT '[]',   -- JSON-Snapshot
    total_cents   INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'neu',
    payment_status TEXT NOT NULL DEFAULT 'offen',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

  CREATE TABLE IF NOT EXISTS newsletter (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    body       TEXT NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Lager: Bestand pro Produkt + Variante (Grösse + optional Farbe)
  CREATE TABLE IF NOT EXISTS inventory (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             TEXT NOT NULL DEFAULT '',
    size            TEXT NOT NULL DEFAULT '',   -- '' = kein Grössen-Variant
    color           TEXT NOT NULL DEFAULT '',
    stock           INTEGER NOT NULL DEFAULT 0,
    reserved        INTEGER NOT NULL DEFAULT 0, -- im Warenkorb reserviert
    min_stock       INTEGER NOT NULL DEFAULT 3, -- Warnschwelle
    next_delivery   TEXT NOT NULL DEFAULT '',   -- ISO-Datum
    notes           TEXT NOT NULL DEFAULT '',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(product_id, size, color)
  );
  CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
`);

export default db;
