/**
 * Order tracking against the Playweary API.
 *
 * Two ways in: the private tracking code from the confirmation screen and
 * emails (/track?code=PWT-…) for the full view, or just the order number for
 * a progress-only view (order numbers are guessable, so no personal details). The stage comes from the order's real status, set by the store
 * team in the admin portal; `timeline` lays the server's events over the
 * five storybook stages the page draws.
 */

import { api, cents } from "./api";

export type StageId = "placed" | "packed" | "shipped" | "out" | "delivered";

export type Stage = {
  id: StageId;
  label: string;
  /** Kid-friendly line shown when this stage is the current one. */
  blurb: string;
  where: string;
  note: string;
};

export const STAGES: Stage[] = [
  { id: "placed", label: "Order placed", blurb: "We got your order and Pip is already doing a happy dance.", where: "Playweary HQ", note: "Order received and payment method noted." },
  { id: "packed", label: "Packed", blurb: "Your kit is folded, tucked and tied up with a bow.", where: "Playweary workshop", note: "Shirt and all three sets packed in a recycled box." },
  { id: "shipped", label: "Shipped", blurb: "Your parcel is off on a big adventure down the road.", where: "With the courier", note: "Handed to the courier." },
  { id: "out", label: "Out for delivery", blurb: "Nearly there! The courier is heading to your street.", where: "Local delivery van", note: "On the van with your name on it." },
  { id: "delivered", label: "Delivered", blurb: "Knock knock! Your kit has arrived. Time to play!", where: "Your front door", note: "Handed over at the address on the order." },
];

export const LAST_STAGE = STAGES.length - 1;

export type OrderStatus = "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export type TrackedLine = { id: string; name: string; size: string; q: number; unitPrice: number; lineTotal: number };

/** GET /v1/track/:code (money converted to dollars). */
export type TrackedOrder = {
  /**
   * True when only the order number was given: progress only. `lines`, totals, `shipTo` and
   * `email` are empty and `trackingCode` is "" (the API withholds them), so the UI must not show them.
   */
  limited?: boolean;
  number: string;
  trackingCode: string;
  status: OrderStatus;
  stage: StageId | "cancelled";
  placedAt: string;
  /** Masked, e.g. j***e@example.com */
  email: string;
  shipTo: { firstName: string; city: string; state: string };
  shipping: "standard" | "express";
  payment: "cod" | "paypal";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  lines: TrackedLine[];
  subtotal: number;
  shippingCost: number;
  /** Promo discount in dollars (0 when none); `total` is already net of it. */
  discount: number;
  promoCode: string | null;
  total: number;
  arrives: [string, string];
  isBackorder: boolean;
  carrier: string | null;
  carrierTrackingNumber: string | null;
  timeline: { status: OrderStatus; stage: StageId | "cancelled"; message: string | null; at: string }[];
};

/** GET /v1/track/by-number/:number */
type LimitedResponse = Pick<
  TrackedOrder,
  "number" | "status" | "stage" | "placedAt" | "arrives" | "isBackorder" | "carrier" | "carrierTrackingNumber" | "timeline"
> & { limited: true };

type TrackResponse = Omit<TrackedOrder, "lines" | "subtotal" | "shippingCost" | "total" | "discount" | "promoCode"> & { promoCode?: string | null } & {
  lines: (Omit<TrackedLine, "unitPrice" | "lineTotal"> & { unitPriceCents: number; lineTotalCents: number })[];
  subtotalCents: number;
  shippingCents: number;
  discountCents?: number;
  totalCents: number;
};

function fromResponse(r: TrackResponse): TrackedOrder {
  const { subtotalCents, shippingCents, discountCents, totalCents, lines, ...rest } = r;
  return {
    ...rest,
    lines: lines.map(({ unitPriceCents, lineTotalCents, ...l }) => ({ ...l, unitPrice: cents(unitPriceCents), lineTotal: cents(lineTotalCents) })),
    subtotal: cents(subtotalCents),
    shippingCost: cents(shippingCents),
    discount: cents(discountCents ?? 0),
    promoCode: r.promoCode ?? null,
    total: cents(totalCents),
  };
}

/* ------------------------------------------------------------- references -- */

/** "pw 100100", "PW-100100" and "100100" all mean PW-100100. */
export function normalizeRef(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^(?:PW)?[\s-]*(\d{6})$/);
  return m ? `PW-${m[1]}` : null;
}

export const TRACKING_CODE_RE = /^PWT-[0-9A-HJKMNP-TV-Z]{12}$/;

export function normalizeCode(input: string): string | null {
  const c = input.trim().toUpperCase();
  return TRACKING_CODE_RE.test(c) ? c : null;
}

/* --------------------------------------------------------------- fetching -- */

export async function trackByCode(code: string): Promise<TrackedOrder> {
  return fromResponse(await api<TrackResponse>(`/v1/track/${encodeURIComponent(code)}`));
}

export async function trackByNumber(number: string): Promise<TrackedOrder> {
  const r = await api<LimitedResponse>(`/v1/track/by-number/${encodeURIComponent(number)}`);
  return {
    ...r,
    trackingCode: "",
    email: "",
    shipTo: { firstName: "", city: "", state: "" },
    shipping: "standard",
    payment: "cod",
    paymentStatus: "UNPAID",
    lines: [],
    subtotal: 0,
    shippingCost: 0,
    discount: 0,
    promoCode: null,
    total: 0,
  };
}

/* ------------------------------------------- orders placed in this browser -- */

/** Only what is needed to reopen tracking: no address, email or phone is kept. */
export type RecentOrder = { number: string; trackingCode: string; placedAt: string };

const KEY = "playweary:orders:v2";
const LEGACY_KEY = "playweary:orders:v1"; // prototype store with full addresses

export function listOrders(): RecentOrder[] {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? (parsed as RecentOrder[]).filter((o) => o && typeof o.number === "string" && typeof o.trackingCode === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberOrder(o: RecentOrder) {
  try {
    const next = [{ number: o.number, trackingCode: o.trackingCode, placedAt: o.placedAt }, ...listOrders().filter((x) => x.number !== o.number)];
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 10)));
  } catch {
    /* storage unavailable: the tracking link in the email still works */
  }
}

/* --------------------------------------------------------------- timeline -- */

/** Index into STAGES that the order has reached (cancelled orders stay at 0). */
export function stageIndex(order: Pick<TrackedOrder, "stage">): number {
  const i = STAGES.findIndex((s) => s.id === order.stage);
  return i < 0 ? 0 : i;
}

export type TimelineEvent = Stage & { index: number; done: boolean; current: boolean; time: Date | null };

/** The five stages with real times from the order's events, and courier details on "shipped". */
export function timeline(order: TrackedOrder, reached = stageIndex(order)): TimelineEvent[] {
  return STAGES.map((s, index) => {
    const events = order.timeline.filter((e) => e.stage === s.id);
    const first = events[0];
    const latest = events[events.length - 1];
    let note = latest?.message ?? s.note;
    let label = s.label;
    if (s.id === "placed") {
      const confirmed = events.some((e) => e.status === "CONFIRMED");
      label = confirmed || reached > 0 ? "Order confirmed" : "Order placed";
      if (!confirmed && reached === 0) note = "We'll confirm your order shortly by email or phone.";
    }
    if (s.id === "shipped" && order.carrierTrackingNumber) {
      note = `${order.carrier ?? "Courier"} tracking number ${order.carrierTrackingNumber}.`;
    }
    return {
      ...s,
      label,
      note,
      index,
      done: index <= reached,
      current: index === reached,
      time: first ? new Date(first.at) : null,
    };
  });
}

/** Orders still moving are re-checked while the page is open. */
export const isFinal = (o: Pick<TrackedOrder, "status">) => o.status === "DELIVERED" || o.status === "CANCELLED";
