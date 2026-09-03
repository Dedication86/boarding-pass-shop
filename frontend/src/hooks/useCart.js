import { useEffect, useMemo, useState } from "react";

const KEY = "bps.bag.v1";

/**
 * Bag state keyed by variantId (product + size).
 * Persisted to localStorage so a refresh doesn't empty the bag.
 */
export function useCart() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  function add(product, variant, quantity = 1) {
    setItems(list => {
      const found = list.find(x => x.variantId === variant.id);
      if (found) {
        return list.map(x => x.variantId === variant.id
          ? { ...x, quantity: Math.min(x.quantity + quantity, variant.stock, 10) }
          : x);
      }
      return [...list, {
        variantId: variant.id,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        size: variant.size,
        price: product.price,
        image: product.image,
        colorway: product.colorway,
        max: Math.min(variant.stock, 10),
        quantity: Math.min(quantity, variant.stock, 10)
      }];
    });
  }

  function setQty(variantId, quantity) {
    setItems(list => quantity <= 0
      ? list.filter(x => x.variantId !== variantId)
      : list.map(x => x.variantId === variantId ? { ...x, quantity: Math.min(quantity, x.max) } : x));
  }

  const remove = variantId => setQty(variantId, 0);
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, x) => s + x.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, x) => s + x.price * x.quantity, 0), [items]);
  const shipping = subtotal === 0 || subtotal >= 150 ? 0 : 8;

  return { items, add, setQty, remove, clear, count, subtotal, shipping, total: subtotal + shipping };
}
