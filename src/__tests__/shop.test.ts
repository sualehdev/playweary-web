import { describe, expect, it } from "vitest";
import { initialShopState, MAX_QTY, ownedSets, shopReducer, cartCount, cartTotal } from "@/store/shop";

const run = (...actions: Parameters<typeof shopReducer>[1][]) =>
  actions.reduce(shopReducer, initialShopState());

describe("cart", () => {
  it("adds a kit in a size and counts it", () => {
    const s = run({ type: "add", id: "kit-boy", size: "5" });
    expect(s.cart).toEqual([{ id: "kit-boy", size: "5", q: 1 }]);
    expect(cartCount(s.cart)).toBe(1);
  });

  it("merges repeat adds of the same kit and size into one line", () => {
    const s = run({ type: "add", id: "kit-boy", size: "5" }, { type: "add", id: "kit-boy", size: "5", qty: 2 });
    expect(s.cart).toEqual([{ id: "kit-boy", size: "5", q: 3 }]);
  });

  it("keeps the same kit in two sizes as two lines", () => {
    const s = run({ type: "add", id: "kit-girl", size: "4T" }, { type: "add", id: "kit-girl", size: "7" });
    expect(s.cart).toHaveLength(2);
  });

  it("ignores products and sizes that do not exist", () => {
    expect(run({ type: "add", id: "nope", size: "5" }).cart).toEqual([]);
    expect(run({ type: "add", id: "kit-boy", size: "XXL" }).cart).toEqual([]);
  });

  it("sets and removes quantities per line, and caps them", () => {
    const base = run({ type: "add", id: "kit-boy", size: "5" }, { type: "add", id: "kit-boy", size: "6" });
    expect(shopReducer(base, { type: "qty", id: "kit-boy", size: "5", q: 4 }).cart[0].q).toBe(4);
    expect(shopReducer(base, { type: "qty", id: "kit-boy", size: "5", q: 0 }).cart).toEqual([{ id: "kit-boy", size: "6", q: 1 }]);
    expect(shopReducer(base, { type: "qty", id: "kit-boy", size: "6", q: 999 }).cart[1].q).toBe(MAX_QTY);
  });

  it("totals from the catalogue: $40 a kit", () => {
    const s = run({ type: "add", id: "kit-boy", size: "5" }, { type: "add", id: "kit-girl", size: "3T", qty: 2 });
    expect(cartTotal(s.cart)).toBe(120);
  });
});

describe("what the bench can dress with", () => {
  it("every set of both characters, since every kit includes them all", () => {
    expect([...ownedSets()].sort()).toEqual(["denim", "garden", "match", "meadow", "street", "trail"]);
  });
});

describe("saved state", () => {
  it("drops lines it no longer recognises, unknown sizes and bad quantities", () => {
    const s = run({
      type: "hydrate",
      state: {
        cart: [
          { id: "kit-boy", size: "5", q: 2 },
          { id: "tee", size: "5", q: 1 },
          { id: "kit-girl", size: "XL", q: 1 },
          { id: "kit-girl", size: "6", q: -3 },
          { id: "kit-girl", size: "7", q: 1.5 },
        ],
      },
    });
    expect(s.cart).toEqual([{ id: "kit-boy", size: "5", q: 2 }]);
    expect(s.hydrated).toBe(true);
  });

  it("drops lines saved before sizes existed", () => {
    // @ts-expect-error an old save without a size
    expect(run({ type: "hydrate", state: { cart: [{ id: "kit-boy", q: 1 }] } }).cart).toEqual([]);
  });

  it("only accepts a known character", () => {
    expect(run({ type: "hydrate", state: { character: "girl" } }).character).toBe("girl");
    // @ts-expect-error a corrupted save
    expect(run({ type: "hydrate", state: { character: "dog" } }).character).toBe("boy");
  });
});
