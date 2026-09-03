import React from "react";
import { money, LANES } from "../api.js";
import { Stamp } from "./ui.jsx";

const SIZES = ["S", "M", "L", "XL", "XXL", "OS"];

export function Filters({ filters, setFilters, collections, resultCount }) {
  const set = patch => setFilters(f => ({ ...f, ...patch }));
  return (
    <div className="filters" id="shop">
      <div className="lanes">
        <button className={!filters.collection ? "is-active" : ""} onClick={() => set({ collection: "" })}>
          All lanes
        </button>
        {collections.map(c => (
          <button key={c.slug} className={filters.collection === c.slug ? "is-active" : ""} onClick={() => set({ collection: c.slug })}>
            <span className="mono">{LANES[c.slug]?.code}</span>{c.name}<em>{c.count}</em>
          </button>
        ))}
      </div>

      <div className="filters__row">
        <input
          type="search" placeholder="Search SKU, name, colorway…" value={filters.q}
          onChange={e => set({ q: e.target.value })} aria-label="Search products"
        />
        <div className="sizes" role="group" aria-label="Filter by size">
          {SIZES.map(s => (
            <button key={s} className={filters.size === s ? "is-active" : ""} onClick={() => set({ size: filters.size === s ? "" : s })}>{s}</button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={filters.inStock === "1"} onChange={e => set({ inStock: e.target.checked ? "1" : "" })} />
          In stock
        </label>
        <select value={filters.sort} onChange={e => set({ sort: e.target.value })} aria-label="Sort">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="name">A–Z</option>
        </select>
        <span className="mono muted filters__count">{resultCount} PCS</span>
      </div>
    </div>
  );
}

export function ProductCard({ product, onOpen }) {
  const lane = LANES[product.collection];
  const sizesLeft = product.variants.filter(v => v.stock > 0).map(v => v.size);
  return (
    <article className={`card card--${product.status}`}>
      <button className="card__media" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
        <img src={product.image} alt={`${product.name} — ${product.colorway}`} loading="lazy" />
        <div className="card__stamps">
          {product.status !== "boarding" && <Stamp status={product.status} />}
          {product.badge === "new" && <Stamp status="boarding">New</Stamp>}
          {product.badge === "sale" && <Stamp status="limited">Sale</Stamp>}
          {product.capsule && <Stamp status="scheduled">Capsule 001</Stamp>}
        </div>
      </button>
      <div className="card__body">
        <div className="card__top">
          <span className="mono muted">{product.sku} · {lane?.code}</span>
          <span className="card__price">
            {product.compare_price && <s>{money(product.compare_price)}</s>}
            {money(product.price)}
          </span>
        </div>
        <h3><button onClick={() => onOpen(product)}>{product.name}</button></h3>
        <p className="muted">{product.colorway}</p>
        <div className="card__sizes mono">
          {product.variants.map(v => (
            <span key={v.id} className={v.stock ? "" : "is-out"}>{v.size}</span>
          ))}
        </div>
        <button className="card__cta" onClick={() => onOpen(product)}>
          {product.status === "standby" ? "Join standby" : sizesLeft.length === 1 && sizesLeft[0] === "OS" ? "Add to bag" : "Select size"}
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, loading, onOpen }) {
  if (loading && !products.length) return <div className="grid grid--empty mono">LOADING…</div>;
  if (!products.length) return (
    <div className="grid grid--empty">
      <p className="eyebrow">No departures</p>
      <p className="muted">Nothing matches that filter. Try another lane or size.</p>
    </div>
  );
  return (
    <div className="grid">
      {products.map(p => <ProductCard key={p.id} product={p} onOpen={onOpen} />)}
    </div>
  );
}
