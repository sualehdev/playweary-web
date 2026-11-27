/**
 * Live price and availability from the API, merged over the static catalogue
 * in content/products (which keeps names, art and copy, and is the fallback
 * when the API cannot be reached).
 */

import type { Product } from "@/content/products";
import { cents } from "./api";

/** One row of GET /v1/products. */
export type LiveProduct = {
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  active: boolean;
  inStock: boolean;
  backorder: boolean;
  backorderNote: string | null;
  purchasable: boolean;
};

export type Catalog = Record<string, LiveProduct>;

export const CATALOG_TAG = "catalog";

export function toCatalog(rows: LiveProduct[]): Catalog {
  return Object.fromEntries(rows.map((r) => [r.sku, r]));
}

/**
 * The struck-through "was" price when the admin has not set a compare-at price: the real
 * price plus 25% ($40 → $50). A compare-at price set in the admin's Products page wins.
 * Set to 0 to show no "was" price unless the admin sets one.
 */
export const COMPARE_AT_MARKUP = 0.25;

const markedUp = (price: number) => (COMPARE_AT_MARKUP > 0 ? Math.round(price * (1 + COMPARE_AT_MARKUP) * 100) / 100 : undefined);

/** Static products with live price/availability applied where the API knows them. */
export function applyCatalog(products: Product[], catalog: Catalog | null | undefined): Product[] {
  return products.map((p) => {
    const live = catalog?.[p.id];
    if (!live) return { ...p, was: p.was ?? markedUp(p.price) };
    const price = cents(live.priceCents);
    return {
      ...p,
      price,
      was: live.compareAtCents && live.compareAtCents > live.priceCents ? cents(live.compareAtCents) : markedUp(price),
      available: live.purchasable,
      backorder: live.backorder,
      backorderNote: live.backorderNote,
    };
  });
}
