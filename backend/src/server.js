import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db, seedIfEmpty, hydrate } from "./db.js";
import { COLLECTIONS } from "./catalog.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const FREE_SHIPPING_OVER = 150;
const FLAT_SHIPPING = 8;

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

if (seedIfEmpty()) console.log("Seeded Departure catalog.");

/* ---------------------------------- auth ---------------------------------- */

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });

function issueAuth(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("auth", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function requireAuth(req, res, next) {
  try {
    req.user = jwt.verify(req.cookies.auth, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sign in to continue." });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Use a valid email and an 8+ character password." });
  const email = parsed.data.email.toLowerCase();
  const hash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const { lastInsertRowid } = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, hash);
    const user = { id: Number(lastInsertRowid), email };
    issueAuth(res, user);
    res.status(201).json({ user });
  } catch {
    res.status(409).json({ error: "That passenger already has an account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid credentials." });
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(parsed.data.email.toLowerCase());
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  issueAuth(res, user);
  res.json({ user: { id: user.id, email: user.email } });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("auth");
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  try {
    const p = jwt.verify(req.cookies.auth, JWT_SECRET);
    res.json({ user: { id: p.sub, email: p.email } });
  } catch {
    res.json({ user: null });
  }
});

/* --------------------------------- catalog -------------------------------- */

app.get("/api/collections", (_req, res) => {
  const counts = db.prepare("SELECT collection, COUNT(*) AS n FROM products GROUP BY collection").all();
  res.json({
    collections: COLLECTIONS.map(c => ({ ...c, count: counts.find(x => x.collection === c.slug)?.n ?? 0 }))
  });
});

app.get("/api/drops", (_req, res) => {
  const drops = db.prepare(`
    SELECT d.*, COUNT(p.id) AS product_count
    FROM drops d LEFT JOIN products p ON p.drop_id = d.id
    GROUP BY d.id
    ORDER BY CASE d.status WHEN 'boarding' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, d.date
  `).all();
  res.json({ drops });
});

const productQuery = z.object({
  q: z.string().max(80).default(""),
  collection: z.string().max(40).default(""),
  size: z.string().max(4).default(""),
  capsule: z.string().max(40).default(""),
  min: z.coerce.number().min(0).default(0),
  max: z.coerce.number().min(0).default(999999),
  sort: z.enum(["featured", "price_asc", "price_desc", "name", "newest"]).default("featured"),
  inStock: z.enum(["", "1"]).default("")
});

app.get("/api/products", (req, res) => {
  const parsed = productQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Bad query." });
  const f = parsed.data;

  let sql = `
    SELECT p.*, d.code AS drop_code, d.name AS drop_name, d.status AS drop_status,
           (SELECT SUM(stock) FROM variants v WHERE v.product_id = p.id) AS total_stock
    FROM products p LEFT JOIN drops d ON d.id = p.drop_id
    WHERE p.price BETWEEN ? AND ?
      AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.colorway LIKE ?)
  `;
  const like = `%${f.q}%`;
  const params = [f.min, f.max, like, like, like, like];
  if (f.collection) { sql += " AND p.collection = ?"; params.push(f.collection); }
  if (f.capsule) { sql += " AND p.capsule = ?"; params.push(f.capsule); }
  if (f.size) { sql += " AND EXISTS (SELECT 1 FROM variants v WHERE v.product_id = p.id AND v.size = ? AND v.stock > 0)"; params.push(f.size); }
  if (f.inStock) sql += " AND total_stock > 0";

  const sortMap = {
    featured: "CASE WHEN p.badge = 'limited' THEN 0 WHEN p.badge = 'new' THEN 1 ELSE 2 END, p.id",
    newest: "p.id DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    name: "p.name ASC"
  };
  sql += ` ORDER BY ${sortMap[f.sort]}`;

  res.json({ products: db.prepare(sql).all(...params).map(hydrate) });
});

app.get("/api/products/:id", (req, res) => {
  const row = db.prepare(`
    SELECT p.*, d.code AS drop_code, d.name AS drop_name, d.status AS drop_status
    FROM products p LEFT JOIN drops d ON d.id = p.drop_id
    WHERE p.id = ? OR p.sku = ?
  `).get(Number(req.params.id) || 0, req.params.id.toUpperCase());
  if (!row) return res.status(404).json({ error: "No such gate." });
  res.json({ product: hydrate(row) });
});

/* --------------------------- standby (restock list) ----------------------- */

app.post("/api/standby", (req, res) => {
  const schema = z.object({ variantId: z.number().int(), email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email required." });
  const variant = db.prepare("SELECT id, stock FROM variants WHERE id = ?").get(parsed.data.variantId);
  if (!variant) return res.status(404).json({ error: "No such size." });
  if (variant.stock > 0) return res.status(409).json({ error: "That size is still boarding — add it to your bag." });
  db.prepare("INSERT OR IGNORE INTO standby (variant_id, email) VALUES (?, ?)").run(variant.id, parsed.data.email.toLowerCase());
  const position = db.prepare("SELECT COUNT(*) AS n FROM standby WHERE variant_id = ?").get(variant.id).n;
  res.status(201).json({ ok: true, position });
});

/* --------------------------------- orders --------------------------------- */

const PNR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — airline style
function makePNR() {
  let s = "";
  for (let i = 0; i < 6; i++) s += PNR_ALPHABET[Math.floor(Math.random() * PNR_ALPHABET.length)];
  return s;
}

app.post("/api/orders", requireAuth, (req, res) => {
  const schema = z.object({
    items: z.array(z.object({ variantId: z.number().int(), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
    paymentToken: z.string().regex(/^mock_tok_[a-z0-9]+$/),
    last4: z.string().regex(/^\d{4}$/)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid checkout payload." });

  const getVariant = db.prepare(`
    SELECT v.id, v.size, v.stock, p.id AS product_id, p.name, p.price
    FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?
  `);
  const insertOrder = db.prepare("INSERT INTO orders (pnr, user_id, subtotal, shipping, total, last4) VALUES (?, ?, ?, ?, ?, ?)");
  const insertItem = db.prepare("INSERT INTO order_items (order_id, variant_id, product_id, name, size, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const takeStock = db.prepare("UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?");

  try {
    const order = db.transaction(() => {
      let subtotal = 0;
      const lines = [];
      for (const item of parsed.data.items) {
        const v = getVariant.get(item.variantId);
        if (!v) throw new Error("An item in your bag no longer exists.");
        if (v.stock < item.quantity) throw new Error(`${v.name} (${v.size}) — only ${v.stock} left.`);
        subtotal += v.price * item.quantity;
        lines.push({ ...v, quantity: item.quantity });
      }
      const shipping = subtotal >= FREE_SHIPPING_OVER ? 0 : FLAT_SHIPPING;
      const total = subtotal + shipping;
      const pnr = makePNR();
      const { lastInsertRowid: orderId } = insertOrder.run(pnr, req.user.sub, subtotal, shipping, total, parsed.data.last4);
      for (const l of lines) {
        if (!takeStock.run(l.quantity, l.id, l.quantity).changes) throw new Error("Stock changed during checkout — please retry.");
        insertItem.run(orderId, l.id, l.product_id, l.name, l.size, l.quantity, l.price);
      }
      return { id: Number(orderId), pnr, subtotal, shipping, total, items: lines.map(l => ({ name: l.name, size: l.size, quantity: l.quantity, price: l.price })) };
    })();
    res.status(201).json({ order });
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

app.get("/api/orders", requireAuth, (req, res) => {
  const orders = db.prepare("SELECT id, pnr, subtotal, shipping, total, status, created_at, last4 FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.user.sub);
  const items = db.prepare("SELECT order_id, name, size, quantity, price FROM order_items WHERE order_id = ?");
  res.json({ orders: orders.map(o => ({ ...o, items: items.all(o.id) })) });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, brand: "Departure Clothing", ts: Date.now() }));

/* ------------------------- static frontend (production) ------------------------- */
// When the frontend has been built (`npm run build` at the repo root), serve it from
// this same server so the whole demo runs as ONE service on ONE URL — no CORS, and the
// auth cookie stays first-party. In local dev, Vite serves the frontend on :5173 instead.
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend/dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
  console.log("Serving frontend from", DIST);
}

app.listen(PORT, () => console.log(`DPT API boarding at http://localhost:${PORT}`));
