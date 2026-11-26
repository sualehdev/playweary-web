/** Admin-editable site settings (served by the API at /v1/settings). */

export const SETTINGS_TAG = "settings";

export type PromoSettings = {
  enabled: boolean;
  messages: string[];
  speed: "slow" | "medium" | "fast";
  /** `left`: text travels right to left. `right`: left to right. */
  direction: "left" | "right";
};

export type ShippingSettings = {
  /** What Standard shipping costs, in cents. 0 means free. */
  standardCents: number;
};

export const DEFAULT_SHIPPING: ShippingSettings = { standardCents: 1200 };

/** "$12" for a rate in cents, "Free" for zero. */
export const shipPrice = (cents: number) => (cents > 0 ? `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}` : "Free");

/** Shown when the API is unreachable or nothing has been saved yet. */
export const DEFAULT_PROMO: PromoSettings = {
  enabled: true,
  messages: ["Standard US shipping in 5 to 7 business days · 30-day returns on unworn items"],
  speed: "medium",
  direction: "left",
};

const PX_PER_SECOND = { slow: 28, medium: 50, fast: 85 } as const;
const CHAR_PX = 8; // rough width of one character in the promo font
const GAP_PX = 64; // space between messages

/** How many times to repeat the messages so one set is wider than any screen, and how long one loop takes. */
export function promoLoop(p: PromoSettings) {
  const one = p.messages.reduce((n, m) => n + m.length * CHAR_PX + GAP_PX, 0);
  const reps = Math.max(1, Math.ceil(2400 / Math.max(one, 1)));
  const seconds = Math.max(10, Math.round((one * reps) / PX_PER_SECOND[p.speed]));
  return { reps, seconds };
}
