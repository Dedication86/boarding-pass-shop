import React, { useEffect } from "react";
import { STATUS } from "../api.js";

/** Rubber-stamp style status tag: BOARDING / LIMITED / STANDBY / DEPARTED. */
export function Stamp({ status, children, className = "" }) {
  const s = STATUS[status] || { label: status, tone: "muted" };
  return <span className={`stamp stamp--${s.tone} ${className}`}>{children || s.label}</span>;
}

/** Perforated ticket-edge divider. */
export function Perforation() {
  return <div className="perf" aria-hidden="true" />;
}

/** Fake barcode drawn with CSS gradients — seeded by a string so it's stable. */
export function Barcode({ seed = "DPT", height = 34 }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bars = [];
  for (let i = 0; i < 40; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(1 + (h % 4));
  }
  return (
    <div className="barcode" style={{ height }} aria-hidden="true">
      {bars.map((w, i) => <i key={i} style={{ width: w, opacity: i % 3 ? 1 : 0 }} />)}
    </div>
  );
}

/** Generic modal / drawer shell. side="right" renders as a drawer. */
export function Sheet({ title, eyebrow, onClose, children, side, wide }) {
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className={`overlay ${side ? "overlay--side" : ""}`} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className={`sheet ${side ? "sheet--drawer" : ""} ${wide ? "sheet--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet__head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="sheet__body">{children}</div>
      </section>
    </div>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <button className={`toast toast--${toast.tone || "ok"}`} onClick={onClose}>
      <span className="toast__dot" />{toast.text}
    </button>
  );
}
