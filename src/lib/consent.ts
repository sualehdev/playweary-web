/**
 * Cookie consent. The shopper's choice lives in localStorage under KEY and is
 * passed to Google Tag Manager as Consent Mode signals, so tags inside the
 * container only record what was agreed. Nothing is stored before a choice.
 */

export const CONSENT_KEY = "pw:consent";
/** Anything can dispatch this on `window` to reopen the settings (the footer link does). */
export const OPEN_CONSENT_EVENT = "pw:open-consent";

export type Consent = { v: 1; analytics: boolean; marketing: boolean; at: string };

type Gtag = (...args: unknown[]) => void;

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<Consent>;
    return c.v === 1 && typeof c.analytics === "boolean" && typeof c.marketing === "boolean" ? (c as Consent) : null;
  } catch {
    return null;
  }
}

/** The Consent Mode signals for a choice. */
export const signals = (c: Pick<Consent, "analytics" | "marketing">) => ({
  analytics_storage: c.analytics ? "granted" : "denied",
  ad_storage: c.marketing ? "granted" : "denied",
  ad_user_data: c.marketing ? "granted" : "denied",
  ad_personalization: c.marketing ? "granted" : "denied",
});

/** Stores the choice and tells GTM. Safe when GTM is not loaded. */
export function saveConsent(choice: { analytics: boolean; marketing: boolean }): Consent {
  const c: Consent = { v: 1, ...choice, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {
    /* storage blocked: the choice applies for this visit only */
  }
  const w = window as Window & { dataLayer?: unknown[] };
  const dl = (w.dataLayer ??= []);
  const gtag: Gtag = function () {
    // GTM reads the `arguments` object, not an array
    // eslint-disable-next-line prefer-rest-params
    dl.push(arguments);
  };
  gtag("consent", "update", signals(c));
  dl.push({ event: "consent_update", consent_analytics: c.analytics, consent_marketing: c.marketing });
  return c;
}
