import React, { useEffect, useState } from "react";
import { Stamp } from "./ui.jsx";

function useCountdown(dateStr) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = new Date(dateStr + "T10:00:00").getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Row({ drop, onSelect }) {
  const countdown = useCountdown(drop.date);
  const date = new Date(drop.date + "T00:00:00");
  const when = date.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase();
  const clickable = drop.status === "boarding" && drop.product_count > 0;
  return (
    <li className={`board__row board__row--${drop.status} ${clickable ? "is-clickable" : ""}`} onClick={() => clickable && onSelect(drop)}>
      <span className="mono board__code">{drop.code}</span>
      <span className="board__name">{drop.name}<small>{drop.blurb}</small></span>
      <span className="mono board__date">{when}</span>
      <span className="mono board__meta">
        {drop.status === "scheduled" && countdown ? countdown : drop.product_count ? `${drop.product_count} PCS` : "—"}
      </span>
      <Stamp status={drop.status} />
    </li>
  );
}

export function DepartureBoard({ drops, onSelect }) {
  return (
    <section className="board" id="departures">
      <div className="section__head">
        <p className="eyebrow">Departures</p>
        <h2>Drop schedule</h2>
        <p className="muted">Live board. Boarding means it's in the shop now. Scheduled means set an alarm. Departed means it's gone.</p>
      </div>
      <ul className="board__list">
        <li className="board__row board__row--head mono">
          <span>FLIGHT</span><span>DROP</span><span>DATE</span><span>REMARKS</span><span>STATUS</span>
        </li>
        {drops.map(d => <Row key={d.id} drop={d} onSelect={onSelect} />)}
      </ul>
    </section>
  );
}
