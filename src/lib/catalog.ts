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

/** Static products with live price/availability applied where the API knows them. */
export function applyCatalog(products: Product[], catalog: Catalog | null | undefined): Product[] {
  if (!catalog) return products;
  return products.map((p) => {
    const live = catalog[p.id];
    if (!live) return p;
    return {
      ...p,
      price: cents(live.priceCents),
      was: live.compareAtCents && live.compareAtCents > live.priceCents ? cents(live.compareAtCents) : undefined,
      available: live.purchasable,
      backorder: live.backorder,
      backorderNote: live.backorderNote,
    };
  });
}
