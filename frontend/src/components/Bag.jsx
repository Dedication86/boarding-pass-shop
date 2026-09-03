import React, { useState } from "react";
import { api, money } from "../api.js";
import { Sheet, Perforation, Barcode } from "./ui.jsx";

export function BagDrawer({ cart, onClose, onCheckout }) {
  const { items, setQty, remove, subtotal, shipping, total } = cart;
  const toFree = Math.max(0, 150 - subtotal);
  return (
    <Sheet title="Your bag" eyebrow={`${cart.count} item${cart.count === 1 ? "" : "s"}`} onClose={onClose} side>
      {!items.length ? (
        <div className="empty">
          <p className="eyebrow">Empty bag</p>
          <p className="muted">Nothing checked yet. Pick a lane and start packing.</p>
          <button className="ghost" onClick={onClose}>Back to shop</button>
        </div>
      ) : (
        <>
          {toFree > 0
            ? <p className="shipbar"><span style={{ width: `${(subtotal / 150) * 100}%` }} />{money(toFree)} away from free shipping</p>
            : <p className="shipbar is-done"><span style={{ width: "100%" }} />Free shipping unlocked</p>}

          <ul className="lines">
            {items.map(x => (
              <li className="line" key={x.variantId}>
                <img src={x.image} alt="" />
                <div className="line__info">
                  <span className="mono muted">{x.sku} · {x.size}</span>
                  <b>{x.name}</b>
                  <span className="muted">{x.colorway}</span>
                  <div className="qty">
                    <button onClick={() => setQty(x.variantId, x.quantity - 1)} aria-label="Decrease">−</button>
                    <span className="mono">{x.quantity}</span>
                    <button onClick={() => setQty(x.variantId, x.quantity + 1)} disabled={x.quantity >= x.max} aria-label="Increase">+</button>
                    <button className="textlink" onClick={() => remove(x.variantId)}>Remove</button>
                  </div>
                </div>
                <span className="line__price">{money(x.price * x.quantity)}</span>
              </li>
            ))}
          </ul>

          <Perforation />
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{shipping ? money(shipping) : "Free"}</dd></div>
            <div className="totals__grand"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          <button className="primary primary--big" onClick={onCheckout}>Proceed to gate →</button>
          <p className="mono muted small">DEMO STORE · NO REAL CHARGES</p>
        </>
      )}
    </Sheet>
  );
}

/** Mock checkout. Card is tokenised client-side; only last4 travels to the API. */
export function CheckoutModal({ cart, user, onClose, onNeedAuth, onPlaced }) {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const formatCard = v => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

  async function submit(e) {
    e.preventDefault();
    if (!user) return onNeedAuth();
    const digits = card.replace(/\D/g, "");
    if (digits.length < 13) return setError("Card number looks short.");
    setBusy(true); setError("");
    try {
      const paymentToken = "mock_tok_" + Math.random().toString(36).slice(2, 12);
      const { order } = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map(x => ({ variantId: x.variantId, quantity: x.quantity })),
          paymentToken,
          last4: digits.slice(-4)
        })
      });
      onPlaced(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title="Gate" eyebrow="Checkout" onClose={onClose}>
      <p className="secure">🔒 Demo checkout — nothing is charged. Card data is tokenised in the browser; only the last four digits reach the server.</p>
      {!user && <p className="notice">You'll need to sign in before boarding. We'll bring you back here.</p>}
      <form className="form" onSubmit={submit}>
        <label>Name on card<input required placeholder="Passenger name" value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Card number<input required inputMode="numeric" className="mono" value={card} onChange={e => setCard(formatCard(e.target.value))} /></label>
        <div className="two">
          <label>Expiry<input required placeholder="MM / YY" className="mono" value={exp} onChange={e => setExp(e.target.value)} /></label>
          <label>CVC<input required maxLength={4} className="mono" value={cvc} onChange={e => setCvc(e.target.value)} /></label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="primary primary--big" disabled={busy}>
          {busy ? "Boarding…" : user ? `Pay ${money(cart.total)}` : "Sign in to continue"}
        </button>
      </form>
    </Sheet>
  );
}

/** Post-purchase: the order rendered as a boarding pass receipt. */
export function ReceiptModal({ order, onClose }) {
  return (
    <Sheet title="You're boarded." eyebrow="Order confirmed" onClose={onClose}>
      <div className="receipt">
        <div className="receipt__head">
          <span className="pass__brand">BOARDING PASS</span>
          <span className="mono">PNR <b>{order.pnr}</b></span>
        </div>
        <div className="pass__route">
          <div><small>FROM</small><b>BPS</b></div>
          <div className="pass__plane">✈</div>
          <div><small>TO</small><b>YOU</b></div>
        </div>
        <ul className="receipt__items mono">
          {order.items.map((it, i) => (
            <li key={i}><span>{it.quantity}× {it.name} · {it.size}</span><span>{money(it.price * it.quantity)}</span></li>
          ))}
        </ul>
        <Perforation />
        <dl className="totals">
          <div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          <div><dt>Shipping</dt><dd>{order.shipping ? money(order.shipping) : "Free"}</dd></div>
          <div className="totals__grand"><dt>Paid</dt><dd>{money(order.total)}</dd></div>
        </dl>
        <Barcode seed={order.pnr} height={44} />
        <p className="mono muted small">KEEP THIS STUB · FIND IT LATER UNDER “MY TRIPS”</p>
      </div>
      <button className="primary primary--big" onClick={onClose}>Back to shop</button>
    </Sheet>
  );
}
