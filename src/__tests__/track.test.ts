import { describe, expect, it } from "vitest";
import { once, purchaseEvent } from "@/lib/track";

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("tracking", () => {
  it("runs a once-only action a single time per key", () => {
    const store = memory();
    let n = 0;
    expect(once("a", () => n++, store)).toBe(true);
    expect(once("a", () => n++, store)).toBe(false);
    expect(once("b", () => n++, store)).toBe(true);
    expect(n).toBe(2);
  });

  it("builds a GA4 purchase from an order", () => {
    const e = purchaseEvent({
      number: "PW-100100",
      total: 52,
      shippingCost: 12,
      lines: [{ id: "boy-kit", name: "Boy kit", size: "4", q: 1, unitPrice: 40 }],
    });
    expect(e.ecommerce).toMatchObject({ transaction_id: "PW-100100", value: 52, currency: "USD", shipping: 12 });
    expect(e.ecommerce.items[0]).toMatchObject({ item_id: "boy-kit", price: 40, quantity: 1, item_variant: "4" });
  });
});
