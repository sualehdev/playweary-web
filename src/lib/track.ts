/** Pushes events to GTM's dataLayer. Safe on the server and when GTM is not loaded. */

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function track(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  (w.dataLayer ??= []).push({ event, ...data });
}

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** Runs `fn` once per key for this browser tab session. A refresh or back button can't repeat it. */
export function once(key: string, fn: () => void, store?: KeyValueStore): boolean {
  try {
    const s = store ?? sessionStorage;
    if (s.getItem(key)) return false;
    s.setItem(key, "1");
  } catch {
    /* storage blocked: better to fire than to lose the conversion */
  }
  fn();
  return true;
}

export type PurchaseOrder = {
  number: string;
  total: number;
  shippingCost: number;
  discount?: number;
  promoCode?: string | null;
  lines: { id: string; name: string; size: string; q: number; unitPrice: number }[];
};

/** The GA4 `purchase` event that Google Ads and Meta conversion tags hang off inside GTM. */
export function purchaseEvent(o: PurchaseOrder) {
  return {
    // flat copies, for tags that cannot read the ecommerce object
    order_value: o.total,
    item_ids: [...new Set(o.lines.map((l) => l.id))].join(","),
    ecommerce: {
      transaction_id: o.number,
      value: o.total,
      currency: "USD",
      shipping: o.shippingCost,
      ...(o.promoCode ? { coupon: o.promoCode, discount: o.discount } : {}),
      items: o.lines.map((l) => ({
        item_id: l.id,
        item_name: l.name,
        item_variant: l.size,
        price: l.unitPrice,
        quantity: l.q,
      })),
    },
  };
}

/** Sends `purchase` exactly once per order number. */
export function trackPurchase(o: PurchaseOrder, store?: KeyValueStore) {
  return once(
    "pw:purchase:" + o.number,
    () => {
      track("clear_ecommerce", { ecommerce: null });
      track("purchase", purchaseEvent(o));
    },
    store
  );
}
