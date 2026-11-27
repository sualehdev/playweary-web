/**
 * The seams between the checkout page and the outside world.
 *
 * Orders are paid with PayPal (Venmo and card included): the API re-prices the
 * order, reserves stock, creates the PayPal order and emails the customer once
 * paid. Cash on delivery is switched off (`placeOrder` is kept for old flows).
 */

import { productById } from "@/content/products";
import type { CartLine } from "@/store/shop";
import { api, cents } from "./api";
import { rememberOrder } from "./orders";

export type ShippingMethod = { id: "standard"; name: string; days: [number, number]; price: number };

/** Standard is the only method. `price` is the default: the live rate is an admin setting (see lib/settings). */
export const SHIPPING: ShippingMethod[] = [{ id: "standard", name: "Standard", days: [5, 7], price: 12 }];

export type PaymentMethod = "cod" | "paypal";

export type Address = {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

export type Order = {
  email: string;
  phone: string;
  address: Address;
  shipping: ShippingMethod["id"];
  payment: PaymentMethod;
  lines: CartLine[];
  /** Optional promo code; the server re-checks it and prices the discount. */
  promoCode?: string;
};

/** A line as the server priced it. */
export type PlacedLine = CartLine & { name: string; unitPrice: number; lineTotal: number };

export type PlacedOrder = Omit<Order, "lines" | "promoCode"> & {
  number: string;
  /** Private code for the tracking link (/track?code=…). */
  trackingCode: string;
  status: string;
  placedAt: string;
  lines: PlacedLine[];
  subtotal: number;
  shippingCost: number;
  /** Promo discount in dollars (0 when none); `total` is already net of it. */
  discount: number;
  promoCode: string | null;
  total: number;
  /** Earliest and latest delivery dates, ISO. */
  arrives: [string, string];
  isBackorder: boolean;
};

/** Pass `useShop().productById` for live prices; a placed line carries its own price. */
export const orderSubtotal = (
  lines: (CartLine & { unitPrice?: number })[],
  lookup: (id: string) => { price: number } | undefined = productById
) => lines.reduce((sum, l) => sum + (l.unitPrice ?? lookup(l.id)?.price ?? 0) * l.q, 0);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shippingById = (_id?: string) => SHIPPING[0];

/** Add business days (Mon to Fri) to a date. */
export function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

/** POST /v1/orders response (money in cents). */
type PlacedOrderResponse = Omit<PlacedOrder, "lines" | "subtotal" | "shippingCost" | "total" | "discount" | "promoCode"> & { promoCode?: string | null } & {
  lines: (CartLine & { name: string; unitPriceCents: number; lineTotalCents: number })[];
  subtotalCents: number;
  shippingCents: number;
  discountCents?: number;
  totalCents: number;
};

export function fromResponse(r: PlacedOrderResponse): PlacedOrder {
  const { subtotalCents, shippingCents, discountCents, totalCents, lines, ...rest } = r;
  return {
    ...rest,
    lines: lines.map(({ unitPriceCents, lineTotalCents, ...l }) => ({
      ...l,
      unitPrice: cents(unitPriceCents),
      lineTotal: cents(lineTotalCents),
    })),
    subtotal: cents(subtotalCents),
    shippingCost: cents(shippingCents),
    discount: cents(discountCents ?? 0),
    promoCode: r.promoCode ?? null,
    total: cents(totalCents),
  };
}

/** One key per checkout attempt: a retry of the same attempt can never create a second order. */
export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

/**
 * Places the order with the API. The server prices it (the totals shown in
 * the cart are only a preview) and returns the order number and tracking code.
 * Throws ApiError with a message that is safe to show.
 */
export async function placeOrder(order: Order, idempotencyKey: string, honeypot = ""): Promise<PlacedOrder> {
  const res = await api<PlacedOrderResponse>("/v1/orders", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: { ...order, ...(honeypot ? { website: honeypot } : {}) },
    timeoutMs: 20_000,
  });
  const placed = fromResponse(res);
  rememberOrder(placed);
  return placed;
}

/* ---------------------------------------------------------------- PayPal -- */

export type PaymentsConfig = { paypal: { enabled: true; clientId: string; env: "sandbox" | "live"; currency: string } | { enabled: false } };

/** Which payment methods the API has switched on (and the public PayPal client id). */
export async function getPaymentsConfig(): Promise<PaymentsConfig> {
  try {
    return await api<PaymentsConfig>("/v1/payments/config", { timeoutMs: 6_000 });
  } catch {
    return { paypal: { enabled: false } }; // checkout then shows that payment is unavailable
  }
}

/**
 * PayPal step 1: the API prices and reserves the order, then creates the PayPal order from
 * its own totals. We only get the PayPal order id back; no amount ever comes from the browser.
 */
export async function createPaypalOrder(order: Order, idempotencyKey: string, honeypot = ""): Promise<string> {
  const res = await api<{ paypalOrderId: string }>("/v1/payments/paypal/orders", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: { ...order, payment: "paypal", ...(honeypot ? { website: honeypot } : {}) },
    timeoutMs: 20_000,
  });
  return res.paypalOrderId;
}

/** PayPal step 2, after the buyer approves: the API captures and returns the placed order. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<PlacedOrder> {
  const res = await api<PlacedOrderResponse>(`/v1/payments/paypal/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    body: {},
    timeoutMs: 30_000,
  });
  const placed = fromResponse(res);
  rememberOrder(placed);
  return placed;
}

/** What the server says a code is worth for this cart (advisory: placing the order re-checks). */
export type PromoPreview = { code: string; label: string; discount: number; itemsDiscount: number; shippingDiscount: number };

export async function validatePromo(code: string, email: string, lines: CartLine[]): Promise<PromoPreview> {
  const res = await api<{ code: string; label: string; discountCents: number; itemsCents: number; shippingCents: number }>("/v1/promo/validate", {
    method: "POST",
    body: { code, email, lines },
  });
  return {
    code: res.code,
    label: res.label,
    discount: cents(res.discountCents),
    itemsDiscount: cents(res.itemsCents),
    shippingDiscount: cents(res.shippingCents),
  };
}

/** City and state for a US ZIP code (public ZIP database). Returns null on any failure: the shopper just types them. */
export async function lookupZip(zip: string): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { places?: { "place name"?: string; "state abbreviation"?: string }[] };
    const p = body.places?.[0];
    const city = p?.["place name"];
    const state = p?.["state abbreviation"];
    return city && state && US_STATES.some(([c]) => c === state) ? { city, state } : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- validation -- */

export const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

export const isZip = (v: string) => /^\d{5}(-\d{4})?$/.test(v.trim());
/** Ten digits once the punctuation is stripped, an optional leading 1 allowed. */
export const isUsPhone = (v: string) => /^1?\d{10}$/.test(v.replace(/[\s().+-]/g, ""));

export type Fields = { email: string; phone: string } & Address;
export type Errors = Partial<Record<keyof Fields, string>>;

/** What is wrong with the form, field by field, in the order the form shows them. */
export function validate(f: Fields, isEmail: (v: string) => boolean): Errors {
  const e: Errors = {};
  if (!isEmail(f.email)) e.email = "Enter an email like name@example.com.";
  if (!isUsPhone(f.phone)) e.phone = "Enter a 10-digit US phone number.";
  if (!f.firstName.trim()) e.firstName = "Enter a first name.";
  if (!f.lastName.trim()) e.lastName = "Enter a last name.";
  if (!f.line1.trim()) e.line1 = "Enter a street address.";
  if (!f.city.trim()) e.city = "Enter a city.";
  if (!US_STATES.some(([code]) => code === f.state)) e.state = "Choose a state.";
  if (!isZip(f.zip)) e.zip = "Enter a 5-digit ZIP code.";
  return e;
}
