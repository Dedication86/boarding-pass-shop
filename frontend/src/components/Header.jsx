import React from "react";

const TICKER = [
  "E.A.R.T.H. — CAPSULE 001 NOW BOARDING",
  "FREE SHIPPING OVER $150",
  "TARMAC UTILITY FW26 · SCHEDULED 17 OCT",
  "EARTH IS A GIANT ESCAPE GAME",
  "NUMBERED RUNS · NO RESTOCKS · JOIN STANDBY"
];

export function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {items.map((t, i) => <span key={i}>{t}<i>✈</i></span>)}
      </div>
    </div>
  );
}

export function Header({ user, count, onOpen, onLogout, onGoShop }) {
  return (
    <header className="header">
      <a className="brand" href="#top" aria-label="Boarding Pass Clothing home">
        <span className="brand__mark">BPS</span>
        <span className="brand__word">Boarding Pass<small>Clothing</small></span>
      </a>

      <nav className="nav">
        <button onClick={() => onGoShop("")}>Shop</button>
        <button onClick={() => onGoShop("transit-minimal")}>Transit Minimal</button>
        <button onClick={() => onGoShop("destination-loud")}>Destination Loud</button>
        <button onClick={() => onGoShop("tarmac-utility")}>Tarmac Utility</button>
        <a href="#departures">Departures</a>
      </nav>

      <div className="header__actions">
        {user
          ? <>
              <button className="ghost" onClick={() => onOpen("orders")}>My trips</button>
              <button className="ghost" onClick={onLogout}>Log out</button>
            </>
          : <button className="ghost" onClick={() => onOpen("auth")}>Sign in</button>}
        <button className="bagbtn" onClick={() => onOpen("bag")}>
          Bag <b>{count}</b>
        </button>
      </div>
    </header>
  );
}
