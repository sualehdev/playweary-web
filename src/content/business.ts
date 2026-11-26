/** The business facts every policy page, the footer and the structured data must agree on. */

export const BUSINESS = {
  brand: "Playweary",
  legalName: "Playweary",
  email: "hello@playweary.com",
  hours: "Monday to Friday, 9 am to 5 pm ET",
  replyTime: "one business day",
  effective: "November 26, 2026",
} as const;

/** True while a text still holds a [TODO: ...] placeholder; such sections are never shown. */
export const hasTodos = (s: string) => /\[TODO/.test(s);
