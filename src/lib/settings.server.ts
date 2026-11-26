/**
 * Server-only: the live site settings (top bar, shipping rate) for a page render.
 *
 * Cached by Next under the "settings" tag; the API calls POST /api/revalidate
 * when an admin saves, so a change shows on the next page view. Never throws:
 * on any failure the page renders with the defaults.
 */

import { API_URL } from "./api";
import { DEFAULT_PROMO, DEFAULT_SHIPPING, SETTINGS_TAG, type PromoSettings, type ShippingSettings } from "./settings";

type Live = { promo: PromoSettings; shipping: ShippingSettings };

async function getSettings(): Promise<Live> {
  const fallback: Live = { promo: DEFAULT_PROMO, shipping: DEFAULT_SHIPPING };
  if (!API_URL) return fallback;
  try {
    const res = await fetch(`${API_URL}/v1/settings`, {
      cache: "force-cache",
      next: { tags: [SETTINGS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { promo?: Partial<PromoSettings>; shipping?: Partial<ShippingSettings> };
    const p = body.promo ?? {};
    const messages = Array.isArray(p.messages) ? p.messages.filter((m) => typeof m === "string" && m.trim()) : [];
    const cents = body.shipping?.standardCents;
    return {
      promo: {
        enabled: p.enabled !== false,
        messages: messages.length ? messages : DEFAULT_PROMO.messages,
        speed: p.speed === "slow" || p.speed === "fast" ? p.speed : "medium",
        direction: p.direction === "right" ? "right" : "left",
      },
      shipping: { standardCents: typeof cents === "number" && cents >= 0 ? Math.round(cents) : DEFAULT_SHIPPING.standardCents },
    };
  } catch {
    return fallback;
  }
}

export const getPromo = async () => (await getSettings()).promo;
export const getShipping = async () => (await getSettings()).shipping;
