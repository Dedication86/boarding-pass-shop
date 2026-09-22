import React from "react";
import { Barcode } from "./ui.jsx";

/**
 * Hero: statement headline + a CSS-built boarding pass for the current capsule.
 * The pass is the brand's core object, so it gets the hero rather than a photo.
 */
export function Hero({ drop, onShopCapsule }) {
  const date = drop ? new Date(drop.date + "T00:00:00") : new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mon = date.toLocaleString("en-US", { month: "short" }).toUpperCase();

  return (
    <section className="hero" id="top">
      <div className="hero__copy">
        <p className="eyebrow">Capsule 001 &nbsp;/&nbsp; E.A.R.T.H.</p>
        <h1>
          Earth is a<br />
          giant <em>escape</em><br />
          game.
        </h1>
        <p className="lede">
          Streetwear built from transit ephemera — boarding passes, baggage tags, departure boards.
          Three lanes. Numbered runs. Made for people who'd rather be in the air.
        </p>
        <div className="hero__cta">
          <button className="primary" onClick={onShopCapsule}>Shop Capsule 001</button>
          <a className="textlink" href="#departures">View departures →</a>
        </div>
      </div>

      <div className="pass" aria-label="Boarding pass graphic">
        <div className="pass__main">
          <div className="pass__row pass__row--top">
            <span className="pass__brand">DEPARTURE</span>
            <span className="mono">DPT · {drop?.code || "DPT001"}</span>
          </div>
          <div className="pass__route">
            <div><small>FROM</small><b>HOME</b></div>
            <div className="pass__plane">✈</div>
            <div><small>TO</small><b>ANYWHERE</b></div>
          </div>
          <div className="pass__grid">
            <div><small>PASSENGER</small><span>YOU / GUEST</span></div>
            <div><small>CAPSULE</small><span>E.A.R.T.H. 001</span></div>
            <div><small>DATE</small><span>{dd} {mon}</span></div>
            <div><small>GATE</small><span>DL</span></div>
            <div><small>SEAT</small><span>1A</span></div>
            <div><small>CLASS</small><span>STANDBY</span></div>
          </div>
          <Barcode seed="EARTH-001" height={40} />
        </div>
        <div className="pass__stub">
          <span className="pass__brand">DPT</span>
          <div><small>FROM</small><b>HOME</b></div>
          <div><small>TO</small><b>ANYWHERE</b></div>
          <div><small>SEAT</small><b>1A</b></div>
          <Barcode seed="STUB-001" height={30} />
        </div>
      </div>
    </section>
  );
}
