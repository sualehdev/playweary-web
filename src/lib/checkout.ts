/**
 * The seams between the checkout page and the outside world.
 *
 * `placeOrder` sends the order to the Playweary API, which re-prices it,
 * reserves stock and emails the customer. PayPal is switched off until
 * launch, so cash on delivery is the only live method.
 */

import { productById } from "@/content/products";
import type { CartLine } from "@/store/shop";
import { api, cents } from "./api";
import { rememberOrder } from "./orders";

export type ShippingMethod = { id: "standard" | "express"; name: string; days: [number, number]; price: number };

export const SHIPPING: ShippingMethod[] = [
  { id: "standard", name: "Standard", days: [5, 7], price: 0 },
  { id: "express", name: "Express", days: [2, 3], price: 12 },
];

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
};

/** A line as the server priced it. */
export type PlacedLine = CartLine & { name: string; unitPrice: number; lineTotal: number };

export type PlacedOrder = Omit<Order, "lines"> & {
  number: string;
  /** Private code for the tracking link (/track?code=…). */
  trackingCode: string;
  status: string;
  placedAt: string;
  lines: PlacedLine[];
  subtotal: number;
  shippingCost: number;
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

export const shippingById = (id: ShippingMethod["id"]) => SHIPPING.find((s) => s.id === id) ?? SHIPPING[0];

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
type PlacedOrderResponse = Omit<PlacedOrder, "lines" | "subtotal" | "shippingCost" | "total"> & {
  lines: (CartLine & { name: string; unitPriceCents: number; lineTotalCents: number })[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export function fromResponse(r: PlacedOrderResponse): PlacedOrder {
  const { subtotalCents, shippingCents, totalCents, lines, ...rest } = r;
  return {
    ...rest,
    lines: lines.map(({ unitPriceCents, lineTotalCents, ...l }) => ({
      ...l,
      unitPrice: cents(unitPriceCents),
      lineTotal: cents(lineTotalCents),
    })),
    subtotal: cents(subtotalCents),
    shippingCost: cents(shippingCents),
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
