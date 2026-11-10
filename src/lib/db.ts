import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export const STORAGE_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR || path.join(process.cwd(), "storage"));
/** Publicly served media (previews, posters, scene images) — served by /media/[...path]. */
export const MEDIA_DIR = path.join(STORAGE_DIR, "media");
/** Private project downloads — only served to buyers by /api/download. */
export const FILES_DIR = path.join(STORAGE_DIR, "files");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  has_ae INTEGER NOT NULL DEFAULT 1,
  has_pr INTEGER NOT NULL DEFAULT 0,
  motionbro INTEGER NOT NULL DEFAULT 0,
  autoresize INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  featured_order INTEGER NOT NULL DEFAULT 0,
  price_ae INTEGER,
  price_pr INTEGER,
  price_both INTEGER,
  sale_percent INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  files_included TEXT NOT NULL DEFAULT '[]',
  size_label TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  elements_count INTEGER,
  custom_features TEXT NOT NULL DEFAULT '[]',
  categories TEXT NOT NULL DEFAULT '[]',
  scenes TEXT NOT NULL DEFAULT '[]',
  preview_image TEXT NOT NULL DEFAULT '',
  preview_video TEXT NOT NULL DEFAULT '',
  file_ae TEXT NOT NULL DEFAULT '',
  file_pr TEXT NOT NULL DEFAULT '',
  sales INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  review_seed_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  google_sub TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  next_url TEXT NOT NULL DEFAULT '/account',
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL,
  total INTEGER NOT NULL,
  access_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_ref TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  format TEXT NOT NULL,
  license TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  price INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'auto',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS reviews_product ON reviews(product_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_customer ON reviews(product_id, user_id) WHERE user_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

const g = globalThis as unknown as { __fsdb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!g.__fsdb) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    fs.mkdirSync(FILES_DIR, { recursive: true });
    const conn = new DatabaseSync(path.join(STORAGE_DIR, "data.db"));
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    conn.exec(SCHEMA);
    g.__fsdb = conn;
  }
  return g.__fsdb;
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

export function nowIso() {
  return new Date().toISOString();
}
