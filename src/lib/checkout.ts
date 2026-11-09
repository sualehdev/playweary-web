/**
 * The seams between the checkout page and the outside world.
 *
 * Nothing here talks to a server yet. `placeOrder` is where an order API goes
 * (today it saves the order in this browser so it can be tracked). PayPal is
 * switched off until launch, so cash on delivery is the only live method.
 */

import { productById } from "@/content/products";
import type { CartLine } from "@/store/shop";
import { DEMO_REFS, listOrders, saveOrder } from "./orders";

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

export type PlacedOrder = Order & {
  number: string;
  placedAt: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  /** Earliest and latest delivery dates, ISO. */
  arrives: [string, string];
};

export const orderSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + (productById(l.id)?.price ?? 0) * l.q, 0);

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

/** A fresh PW-###### reference that no stored order already uses. */
export function orderNumber(taken: string[] = listOrders().map((o) => o.number), rand: () => number = Math.random) {
  for (;;) {
    const n = "PW-" + Math.floor(100000 + rand() * 900000);
    if (!taken.includes(n) && !DEMO_REFS.includes(n as (typeof DEMO_REFS)[number])) return n;
  }
}

/** Places the order. Today it is confirmed on the spot; an order API goes here. */
export async function placeOrder(order: Order, now = new Date()): Promise<PlacedOrder> {
  await new Promise((r) => setTimeout(r, 500));
  const ship = shippingById(order.shipping);
  const subtotal = orderSubtotal(order.lines);
  const placed: PlacedOrder = {
    ...order,
    number: orderNumber(),
    placedAt: now.toISOString(),
    subtotal,
    shippingCost: ship.price,
    total: subtotal + ship.price,
    arrives: [addBusinessDays(now, ship.days[0]).toISOString(), addBusinessDays(now, ship.days[1]).toISOString()],
  };
  saveOrder(placed);
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
