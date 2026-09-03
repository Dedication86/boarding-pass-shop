import Database from "better-sqlite3";
import { PRODUCTS, DROPS, sizesFor } from "./catalog.js";

export const db = new Database(process.env.DB_PATH || "bps.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('boarding','scheduled','departed')),
  date TEXT NOT NULL,
  blurb TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  capsule TEXT,
  drop_id INTEGER REFERENCES drops(id),
  description TEXT,
  details TEXT,              -- JSON array of strings
  price REAL NOT NULL,
  compare_price REAL,
  colorway TEXT,
  image TEXT,
  badge TEXT,                -- new | limited | sale | null
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size)
);

CREATE TABLE IF NOT EXISTS standby (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  email TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(variant_id, email)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pnr TEXT UNIQUE NOT NULL,   -- 6-char booking reference shown to the customer
  user_id INTEGER NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL,
  shipping REAL NOT NULL,
  total REAL NOT NULL,
  last4 TEXT,
  status TEXT DEFAULT 'paid',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  variant_id INTEGER NOT NULL REFERENCES variants(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL
);
`);

export function seedIfEmpty() {
  const n = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  if (n) return false;

  const insDrop = db.prepare("INSERT INTO drops (code, name, status, date, blurb) VALUES (?, ?, ?, ?, ?)");
  const insProduct = db.prepare(`
    INSERT INTO products (sku, name, collection, capsule, drop_id, description, details, price, compare_price, colorway, image, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insVariant = db.prepare("INSERT INTO variants (product_id, size, stock) VALUES (?, ?, ?)");

  db.transaction(() => {
    const dropIds = {};
    for (const d of DROPS) {
      dropIds[d.code] = insDrop.run(d.code, d.name, d.status, d.date, d.blurb).lastInsertRowid;
    }
    for (const p of PRODUCTS) {
      const image = `/products/${p.sku.toLowerCase()}.svg`;
      const pid = insProduct.run(
        p.sku, p.name, p.collection, p.capsule, p.dropCode ? dropIds[p.dropCode] : null,
        p.description, JSON.stringify(p.details), p.price, p.comparePrice, p.colorway, image, p.badge
      ).lastInsertRowid;
      for (const size of sizesFor(p)) insVariant.run(pid, size, p.stock[size] ?? 0);
    }
  })();
  return true;
}

/** Attach variants + derived stock state to a product row. */
const variantsFor = db.prepare("SELECT id, size, stock FROM variants WHERE product_id = ? ORDER BY id");
export function hydrate(row) {
  if (!row) return null;
  const variants = variantsFor.all(row.id);
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  return {
    ...row,
    details: row.details ? JSON.parse(row.details) : [],
    variants,
    totalStock,
    // Status vocabulary borrowed from the departures board.
    //   boarding = in stock · limited = low · standby = sold out (waitlist open)
    status: totalStock === 0 ? "standby" : totalStock <= 8 || row.badge === "limited" ? "limited" : "boarding"
  };
}
