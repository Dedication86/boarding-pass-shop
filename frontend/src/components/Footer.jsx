import React from "react";
import { Barcode } from "./ui.jsx";

export function LaneStrip({ collections, onSelect }) {
  const copy = {
    "transit-minimal": "Tonal heavyweights. One orange hit, max. For the quiet part of the trip.",
    "destination-loud": "Big graphics, capsule drops, colour you can spot across a terminal.",
    "tarmac-utility": "Cargo, canvas, reflective tape. Ground-crew grade, built to be worked in."
  };
  return (
    <section className="lanestrip">
      {collections.map(c => (
        <button key={c.slug} className={`lanecard lanecard--${c.slug}`} onClick={() => onSelect(c.slug)}>
          <span className="mono">LANE {c.slug.split("-").map(w => w[0]).join("").toUpperCase()} · {c.count} PCS</span>
          <h3>{c.name}</h3>
          <p>{copy[c.slug]}</p>
          <em>Enter lane →</em>
        </button>
      ))}
    </section>
  );
}

export function Manifesto() {
  return (
    <section className="manifesto">
      <p className="eyebrow">Manifesto</p>
      <h2>
        The boarding pass is the most honest piece of paper you'll ever hold.<br />
        It says exactly where you're going and when. <em>We make clothes that do the same.</em>
      </h2>
      <div className="manifesto__grid mono">
        <div><small>ORIGIN</small><span>Nashville, TN</span></div>
        <div><small>MATERIALS</small><span>260gsm+ only</span></div>
        <div><small>RUNS</small><span>Numbered · no restocks</span></div>
        <div><small>STATUS</small><span>Always standby</span></div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div>
          <span className="brand__mark">BPS</span>
          <p className="muted">Boarding Pass Clothing. Streetwear from transit ephemera.<br />Earth is a giant escape game.</p>
        </div>
        <div className="footer__cols">
          <div><b>Lanes</b><a href="#shop">Transit Minimal</a><a href="#shop">Destination Loud</a><a href="#shop">Tarmac Utility</a></div>
          <div><b>Capsules</b><a href="#shop">E.A.R.T.H. 001</a><a href="#departures">Departures</a></div>
          <div><b>Help</b><a href="#">Sizing</a><a href="#">Shipping</a><a href="#">Returns</a></div>
        </div>
      </div>
      <div className="footer__bottom mono">
        <Barcode seed="FOOTER" height={26} />
        <span>© {new Date().getFullYear()} BOARDING PASS CLOTHING · DEMO STORE · NO REAL PAYMENTS</span>
        <span>DESIGN + BUILD: DEDICATION STUDIOS</span>
      </div>
    </footer>
  );
}
