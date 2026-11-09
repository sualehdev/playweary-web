/**
 * Prototype order store and tracking model. Everything is dummy data: orders
 * live in this browser's localStorage and their journey is derived from the
 * time since they were placed (compressed to minutes so a demo moves). A real
 * order API and courier feed replace `getOrder` / `stageAt` / `timeline`.
 */

import type { PlacedOrder } from "./checkout";

export type StageId = "placed" | "packed" | "shipped" | "out" | "delivered";

export type Stage = {
  id: StageId;
  label: string;
  /** Kid-friendly line shown when this stage is the current one. */
  blurb: string;
  /** Minutes after the order was placed that this stage begins (demo time). */
  at: number;
  where: string;
  note: string;
};

export const STAGES: Stage[] = [
  { id: "placed", label: "Order placed", blurb: "We got your order and Pip is already doing a happy dance.", at: 0, where: "Playweary HQ", note: "Order confirmed and payment method noted." },
  { id: "packed", label: "Packed", blurb: "Your kit is folded, tucked and tied up with a bow.", at: 2, where: "Playweary workshop", note: "Shirt and all three sets packed in a recycled box." },
  { id: "shipped", label: "Shipped", blurb: "Your parcel is off on a big adventure down the road.", at: 6, where: "Regional sorting hub", note: "Handed to the courier and scanned at the hub." },
  { id: "out", label: "Out for delivery", blurb: "Nearly there! The courier is heading to your street.", at: 12, where: "Local delivery van", note: "On the van with your name on it." },
  { id: "delivered", label: "Delivered", blurb: "Knock knock! Your kit has arrived. Time to play!", at: 20, where: "Your front door", note: "Handed over at the address on the order." },
];

export const LAST_STAGE = STAGES.length - 1;

export type TrackedOrder = PlacedOrder & {
  /** Minutes added to the clock by the demo "Next stage" button. */
  skew?: number;
  /** Demo orders hold one stage for ever. */
  frozen?: number;
  demo?: boolean;
};

const KEY = "playweary:orders:v1";

/** "pw 100001", "PW-100001" and "100001" all mean PW-100001. */
export function normalizeRef(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^(?:PW)?[\s-]*(\d{6})$/);
  return m ? `PW-${m[1]}` : null;
}

function readAll(): TrackedOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TrackedOrder[]).filter((o) => o && typeof o.number === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(orders: TrackedOrder[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders.slice(0, 20)));
  } catch {
    /* storage unavailable: tracking still works for this tab */
  }
}

export const listOrders = () => readAll();

export function saveOrder(order: PlacedOrder) {
  writeAll([order, ...readAll().filter((o) => o.number !== order.number)]);
}

export function setSkew(number: string, skew: number) {
  writeAll(readAll().map((o) => (o.number === number ? { ...o, skew } : o)));
}

export function demoOrders(now = new Date()): TrackedOrder[] {
  const base = {
    email: "demo@playweary.com",
    phone: "(555) 010-0000",
    shipping: "standard" as const,
    payment: "cod" as const,
    subtotal: 40,
    shippingCost: 0,
    total: 40,
    demo: true,
  };
  const mk = (n: string, frozen: number, first: string, size: string, character: "boy" | "girl", city: string, state: string, zip: string): TrackedOrder => {
    const placed = new Date(now.getTime() - (frozen + 1) * 86_400_000);
    return {
      ...base,
      number: n,
      frozen,
      placedAt: placed.toISOString(),
      address: { firstName: first, lastName: "Demo", line1: "12 Rainbow Lane", line2: "", city, state, zip },
      lines: [{ id: character === "boy" ? "kit-boy" : "kit-girl", size, q: 1 }],
      arrives: [new Date(now.getTime() + 2 * 86_400_000).toISOString(), new Date(now.getTime() + 4 * 86_400_000).toISOString()],
    } as TrackedOrder;
  };
  return [
    mk("PW-100001", 1, "Maya", "4T", "girl", "Austin", "TX", "73301"),
    mk("PW-100002", 2, "Leo", "5", "boy", "Portland", "OR", "97201"),
    mk("PW-100003", 4, "Ava", "6", "girl", "Denver", "CO", "80201"),
    mk("PW-100004", 3, "Noah", "3T", "boy", "Chicago", "IL", "60601"),
  ];
}

export const DEMO_REFS = ["PW-100001", "PW-100002", "PW-100003", "PW-100004"] as const;

/** Looks up an order by any spelling of its reference. Browser only. */
export function getOrder(input: string, now = new Date()): TrackedOrder | null {
  const ref = normalizeRef(input);
  if (!ref) return null;
  return readAll().find((o) => o.number === ref) ?? demoOrders(now).find((o) => o.number === ref) ?? null;
}

/** Index into STAGES that the order has reached. */
export function stageAt(order: TrackedOrder, now = new Date()): number {
  if (order.frozen !== undefined) return Math.min(LAST_STAGE, Math.max(0, order.frozen));
  const minutes = (now.getTime() - new Date(order.placedAt).getTime()) / 60_000 + (order.skew ?? 0);
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (minutes >= s.at) idx = i;
  });
  return idx;
}

/** Skew (minutes) that puts the order exactly at the start of stage `idx`. */
export function skewFor(order: TrackedOrder, idx: number, now = new Date()): number {
  const elapsed = (now.getTime() - new Date(order.placedAt).getTime()) / 60_000;
  return STAGES[Math.min(LAST_STAGE, idx)].at - elapsed + 0.01;
}

export type TimelineEvent = Stage & { index: number; done: boolean; current: boolean; time: Date };

export function timeline(order: TrackedOrder, reached: number): TimelineEvent[] {
  const placed = new Date(order.placedAt).getTime();
  return STAGES.map((s, index) => ({
    ...s,
    index,
    done: index <= reached,
    current: index === reached,
    // Real calendar time: each stage a few hours apart, so it reads like a real feed.
    time: new Date(placed + [0, 2, 20, 30, 52][index] * 3_600_000),
  }));
}
