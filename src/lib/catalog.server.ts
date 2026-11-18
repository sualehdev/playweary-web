/**
 * Server-only: fetch the live catalog for a page render.
 *
 * Cached by Next under the "catalog" tag. The API calls POST /api/revalidate
 * after a price or stock change, which expires the tag immediately; the
 * 5-minute revalidate is only a safety net if a webhook is ever missed.
 * Never throws: on any failure the page renders with the static catalogue.
 */

import { API_URL } from "./api";
import { CATALOG_TAG, toCatalog, type Catalog, type LiveProduct } from "./catalog";

export async function getCatalog(): Promise<Catalog | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/v1/products`, {
      cache: "force-cache",
      next: { tags: [CATALOG_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return toCatalog((await res.json()) as LiveProduct[]);
  } catch {
    return null;
  }
}
