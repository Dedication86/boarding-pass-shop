# Boarding Pass Clothing — Streetwear Storefront (Demo)

A full-stack e-commerce demo for **Boarding Pass Clothing (BPS)** — a streetwear concept built from transit ephemera: boarding passes, baggage tags, departure boards.

> "Earth is a giant escape game."

Built by Dedication Studios as a portfolio piece and a working prototype for the BPS brand. React + Vite frontend, Express + SQLite backend. No real payments.

---

## What it does

**Storefront**
- Hero built around a CSS boarding pass (the brand's core object) — no hero photo needed
- Three design lanes as collections: **Transit Minimal · Destination Loud · Tarmac Utility**
- Capsule filtering (E.A.R.T.H. — Capsule 001)
- Search, size filter, in-stock filter, sort
- Live **departure board** of drops with countdowns (Boarding / Scheduled / Departed)
- Product drawer with size picker, per-size stock, low-stock indicator
- **Standby list** (restock waitlist) for sold-out sizes
- Bag drawer with quantity controls and a free-shipping progress bar (free over $150)
- Gated mock checkout → order receipt rendered as a boarding pass with a 6-char **PNR**
- "My trips" order history
- Persistent bag (localStorage), toasts, keyboard-closable sheets, responsive down to 390px

**API**
- JWT-in-httpOnly-cookie auth (register / login / logout / me)
- Products with **size variants**, collections, capsules, drops
- Transactional checkout with per-variant stock decrement (rolls back on any failure)
- Orders with line items, subtotal / shipping / total
- Standby (waitlist) endpoint with position
- Zod validation on every write

---

## Run it

Two terminals.

```bash
# 1 — API (http://localhost:4000)
cd backend
npm install
npm run dev
```

```bash
# 2 — Web (http://localhost:5173)
cd frontend
npm install
npm run dev
```

First API start seeds the catalog into `backend/bps.db`. To reseed from scratch: `npm run reset` in `backend/`, then restart.

Demo account: create one with any email + 8-char password. Test card: anything numeric (default `4242 4242 4242 4242`).

---

## Deploy (Railway, one service)

The Express server serves the built frontend from `frontend/dist`, so the whole demo runs as a single Railway service on one URL.

1. Push this folder to a GitHub repo.
2. Railway → **New Project → Deploy from GitHub repo**. `railway.json` sets the build (`npm run build`) and start (`npm start`) commands automatically.
3. **Variables** tab → add `JWT_SECRET` (any long random string) and `NODE_ENV=production`.
4. **Settings → Networking → Generate Domain** — that's your public link.
5. Optional, so accounts/orders survive redeploys: **+ New → Volume**, mount at `/data`, then add `DB_PATH=/data/bps.db`. Without a volume the catalog re-seeds fresh on every deploy, which is fine for a demo.

`/api/health` is the healthcheck. Local dev is unchanged (two terminals, above).

---

## Project structure

```
boarding-pass-shop/
├─ backend/
│  └─ src/
│     ├─ server.js      Express app + routes
│     ├─ db.js          SQLite schema, seeding, product hydration
│     └─ catalog.js     Seed data: collections, drops, 12 products + stock
├─ frontend/
│  ├─ public/products/  Generated SVG product tiles (placeholder art)
│  └─ src/
│     ├─ App.jsx        State + composition
│     ├─ api.js         Fetch wrapper, money(), lane + status vocab
│     ├─ hooks/useCart.js
│     ├─ components/    Header, Hero, DepartureBoard, Shop, ProductDrawer, Bag, Account, Footer, ui
│     └─ styles.css     Full visual system (tokens at top)
├─ scripts/
│  └─ generate-art.mjs  Regenerates the SVG product tiles from catalog.js
└─ docs/
   └─ BRAND.md          Mini brand system used in the demo
```

---

## API reference

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password }` → sets cookie |
| POST | `/api/auth/login` | — | |
| POST | `/api/auth/logout` | — | |
| GET | `/api/auth/me` | — | `{ user \| null }` |
| GET | `/api/collections` | — | lanes with counts |
| GET | `/api/drops` | — | departure board rows |
| GET | `/api/products` | — | `q, collection, size, capsule, min, max, sort, inStock` |
| GET | `/api/products/:idOrSku` | — | includes `variants[]`, `status` |
| POST | `/api/standby` | — | `{ variantId, email }` → `{ position }` |
| POST | `/api/orders` | ✓ | `{ items:[{variantId, quantity}], paymentToken, last4 }` |
| GET | `/api/orders` | ✓ | orders with items |

Product `status` vocabulary mirrors the departure board: `boarding` (in stock) · `limited` (≤ 8 left or flagged) · `standby` (sold out, waitlist open).

---

## Swapping in real product photography

The SVG tiles are deliberate placeholders. When photos exist:

1. Drop images in `frontend/public/products/` (4:5 ratio, ~1200×1500)
2. Change `image` in `backend/src/db.js` seeding (or update the `products.image` column)
3. `npm run reset` in backend and restart

Nothing else changes — the cards, drawer, bag and receipt all read `product.image`.

---

## Security notes (demo scope)

- Card data never reaches the server; the browser generates a `mock_tok_*` token and sends only `last4`. In production use Stripe Checkout / Elements — never handle PANs yourself.
- Cookie is httpOnly + SameSite=Lax; `secure` flips on when `NODE_ENV=production`.
- Set `JWT_SECRET` for anything beyond localhost. `CLIENT_ORIGIN` is only needed if the frontend is hosted on a different domain than the API.

---

## Roadmap (not built — on purpose)

Phase 2 candidates, roughly in value order:
- Product photography replacing SVG tiles
- Drop countdown → automatic "boarding" flip on release date
- Standby notifications (email) when stock is restored
- Admin: stock adjustments + drop scheduling
- Real payments (Stripe Checkout) behind a feature flag
- Lookbook / capsule story page for E.A.R.T.H.

---

Design + build: Dedication Studios · Brand concept: Boarding Pass Clothing (Brandon Lile)
