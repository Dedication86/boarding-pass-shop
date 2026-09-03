import React, { useEffect, useState } from "react";
import { api, money } from "../api.js";
import { Sheet, Stamp } from "./ui.jsx";

export function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { user } = await api(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST", body: JSON.stringify({ email, password })
      });
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={mode === "register" ? "New passenger" : "Welcome back"} eyebrow="Check-in" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input required minLength={8} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary primary--big" disabled={busy}>{busy ? "…" : mode === "register" ? "Create account" : "Sign in"}</button>
      </form>
      <button className="textlink" onClick={() => setMode(mode === "register" ? "login" : "register")}>
        {mode === "register" ? "Already checked in? Sign in" : "First flight? Create an account"}
      </button>
      <p className="mono muted small">DEMO · USE ANY EMAIL + 8-CHAR PASSWORD</p>
    </Sheet>
  );
}

export function OrdersModal({ onClose }) {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api("/orders").then(x => setOrders(x.orders)).catch(() => setOrders([])); }, []);

  return (
    <Sheet title="My trips" eyebrow="Order history" onClose={onClose} side>
      {orders === null ? <p className="mono muted">LOADING…</p>
        : !orders.length ? (
          <div className="empty">
            <p className="eyebrow">No trips yet</p>
            <p className="muted">Your boarding passes will collect here.</p>
          </div>
        ) : (
          <ul className="trips">
            {orders.map(o => (
              <li key={o.id} className="trip">
                <div className="trip__head">
                  <span className="mono">PNR <b>{o.pnr}</b></span>
                  <Stamp status="boarding">{o.status}</Stamp>
                </div>
                <p className="mono muted small">{new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString()} · CARD •••• {o.last4}</p>
                <ul className="trip__items">
                  {o.items.map((it, i) => <li key={i}><span>{it.quantity}× {it.name} · {it.size}</span><span>{money(it.price * it.quantity)}</span></li>)}
                </ul>
                <div className="trip__total"><span>Total</span><b>{money(o.total)}</b></div>
              </li>
            ))}
          </ul>
        )}
    </Sheet>
  );
}
