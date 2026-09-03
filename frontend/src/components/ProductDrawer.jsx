import React, { useState } from "react";
import { api, money, LANES } from "../api.js";
import { Sheet, Stamp, Perforation } from "./ui.jsx";

/**
 * Product detail drawer: size picker → add to bag, or standby list for sold-out sizes.
 */
export function ProductDrawer({ product, onClose, onAdd, notify }) {
  const inStock = product.variants.filter(v => v.stock > 0);
  const [variant, setVariant] = useState(inStock.length === 1 ? inStock[0] : null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const lane = LANES[product.collection];
  const soldOutSelected = variant && variant.stock === 0;

  async function joinStandby(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { position } = await api("/standby", { method: "POST", body: JSON.stringify({ variantId: variant.id, email }) });
      notify({ text: `On the standby list for ${product.name} (${variant.size}) — position ${position}.`, tone: "info" });
      onClose();
    } catch (err) {
      notify({ text: err.message, tone: "warn" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={product.name} eyebrow={`${product.sku} · ${lane?.name}`} onClose={onClose} side wide>
      <div className="pd">
        <div className="pd__media">
          <img src={product.image} alt={`${product.name} — ${product.colorway}`} />
        </div>
        <div className="pd__info">
          <div className="pd__stamps">
            <Stamp status={product.status} />
            {product.capsule && <Stamp status="scheduled">Capsule 001 · {product.capsule}</Stamp>}
            {product.drop_name && <span className="mono muted">{product.drop_code}</span>}
          </div>
          <p className="pd__price">
            {product.compare_price && <s>{money(product.compare_price)}</s>}
            {money(product.price)}
          </p>
          <p className="muted">{product.colorway}</p>
          <p className="pd__desc">{product.description}</p>

          <div className="pd__sizes">
            <div className="pd__sizes-head">
              <span className="eyebrow">Size</span>
              {variant && <span className="mono muted">{variant.stock > 0 ? `${variant.stock} left` : "sold out"}</span>}
            </div>
            <div className="sizepick" role="radiogroup" aria-label="Size">
              {product.variants.map(v => (
                <button
                  key={v.id} role="radio" aria-checked={variant?.id === v.id}
                  className={`${variant?.id === v.id ? "is-active" : ""} ${v.stock ? "" : "is-out"} ${v.stock > 0 && v.stock <= 3 ? "is-low" : ""}`}
                  onClick={() => setVariant(v)}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {soldOutSelected ? (
            <form className="standby" onSubmit={joinStandby}>
              <p className="muted">That size has departed. Join the standby list and we'll notify you if a seat opens up.</p>
              <div className="standby__row">
                <input required type="email" placeholder="you@somewhere.com" value={email} onChange={e => setEmail(e.target.value)} />
                <button className="primary" disabled={busy}>{busy ? "…" : "Join standby"}</button>
              </div>
            </form>
          ) : (
            <button className="primary primary--big" disabled={!variant} onClick={() => { onAdd(product, variant); onClose(); }}>
              {variant ? `Add to bag — ${money(product.price)}` : "Select a size"}
            </button>
          )}

          <Perforation />
          <ul className="pd__details">
            {product.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
          <p className="mono muted pd__foot">FREE SHIPPING OVER $150 · 14-DAY RETURNS · NUMBERED RUNS DON'T RESTOCK</p>
        </div>
      </div>
    </Sheet>
  );
}
