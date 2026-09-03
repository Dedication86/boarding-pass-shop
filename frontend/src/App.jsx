import React, { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useCart } from "./hooks/useCart.js";
import { Header, Ticker } from "./components/Header.jsx";
import { Hero } from "./components/Hero.jsx";
import { DepartureBoard } from "./components/DepartureBoard.jsx";
import { Filters, ProductGrid } from "./components/Shop.jsx";
import { ProductDrawer } from "./components/ProductDrawer.jsx";
import { BagDrawer, CheckoutModal, ReceiptModal } from "./components/Bag.jsx";
import { AuthModal, OrdersModal } from "./components/Account.jsx";
import { LaneStrip, Manifesto, Footer } from "./components/Footer.jsx";
import { Toast } from "./components/ui.jsx";

const DEFAULT_FILTERS = { q: "", collection: "", size: "", capsule: "", sort: "featured", inStock: "" };

export default function App() {
  const cart = useCart();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [drops, setDrops] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);       // "bag" | "checkout" | "auth" | "orders" | null
  const [product, setProduct] = useState(null);   // product drawer
  const [receipt, setReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const [afterAuth, setAfterAuth] = useState(null);
  const [apiDown, setApiDown] = useState(false);

  const notify = useCallback(t => setToast(t), []);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    api("/auth/me").then(x => setUser(x.user)).catch(() => setApiDown(true));
    api("/collections").then(x => setCollections(x.collections)).catch(() => {});
    api("/drops").then(x => setDrops(x.drops)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ""));
    const t = setTimeout(() => {
      api("/products?" + params)
        .then(x => { setProducts(x.products); setApiDown(false); })
        .catch(() => setApiDown(true))
        .finally(() => setLoading(false));
    }, filters.q ? 180 : 0);
    return () => clearTimeout(t);
  }, [filters]);

  /** Reload the catalog (stock changes after checkout). */
  const refresh = useCallback(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ""));
    api("/products?" + params).then(x => setProducts(x.products)).catch(() => {});
    api("/drops").then(x => setDrops(x.drops)).catch(() => {});
  }, [filters]);

  function goShop(collection, extra = {}) {
    setFilters({ ...DEFAULT_FILTERS, collection, ...extra });
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addToBag(p, variant) {
    cart.add(p, variant);
    notify({ text: `${p.name} (${variant.size}) added to your bag.` });
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    notify({ text: "Signed out. Safe travels.", tone: "info" });
  }

  function onAuthed(u) {
    setUser(u);
    setPanel(afterAuth || null);
    setAfterAuth(null);
  }

  function onPlaced(order) {
    cart.clear();
    setPanel(null);
    setReceipt(order);
    refresh();
  }

  const liveDrop = drops.find(d => d.status === "boarding");

  return (
    <>
      <Ticker />
      <Header user={user} count={cart.count} onOpen={setPanel} onLogout={logout} onGoShop={goShop} />

      {apiDown && (
        <div className="apidown mono">
          API OFFLINE — start the backend (<code>cd backend && npm run dev</code>) and refresh.
        </div>
      )}

      <main>
        <Hero drop={liveDrop} onShopCapsule={() => goShop("", { capsule: "E.A.R.T.H." })} />
        <LaneStrip collections={collections} onSelect={goShop} />

        <section className="shop">
          <div className="section__head">
            <p className="eyebrow">{filters.capsule ? `Capsule 001 · ${filters.capsule}` : "Shop"}</p>
            <h2>{filters.collection ? collections.find(c => c.slug === filters.collection)?.name : filters.capsule ? "Escape Game" : "All departures"}</h2>
            {filters.collection && <p className="muted">{collections.find(c => c.slug === filters.collection)?.tagline}</p>}
          </div>
          <Filters filters={filters} setFilters={setFilters} collections={collections} resultCount={products.length} />
          <ProductGrid products={products} loading={loading} onOpen={setProduct} />
        </section>

        <DepartureBoard drops={drops} onSelect={() => goShop("", { capsule: "E.A.R.T.H." })} />
        <Manifesto />
      </main>
      <Footer />

      <Toast toast={toast} onClose={closeToast} />

      {product && <ProductDrawer product={product} onClose={() => setProduct(null)} onAdd={addToBag} notify={notify} />}
      {panel === "bag" && <BagDrawer cart={cart} onClose={() => setPanel(null)} onCheckout={() => setPanel("checkout")} />}
      {panel === "checkout" && (
        <CheckoutModal
          cart={cart} user={user} onClose={() => setPanel(null)}
          onNeedAuth={() => { setAfterAuth("checkout"); setPanel("auth"); }}
          onPlaced={onPlaced}
        />
      )}
      {panel === "auth" && <AuthModal onClose={() => { setPanel(null); setAfterAuth(null); }} onAuthed={onAuthed} />}
      {panel === "orders" && <OrdersModal onClose={() => setPanel(null)} />}
      {receipt && <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
