/**
 * The footer's information pages. Mock copy written to read like the real
 * thing; swap in the final policy text before launch.
 */

import { SIZES } from "./products";

export type InfoEntry = { id: string; title: string; body: string[] };

export const INFO: InfoEntry[] = [
  {
    id: "sizing",
    title: "Sizing",
    body: [
      "Sizes go by height, not age. Measure your child standing, barefoot, against a wall, and pick the size that covers that height. Between two sizes? Go up: the shirt has room to grow and the velcro pieces fit every size.",
      ...SIZES.map((s) => `Size ${s.id}: ${s.inches} tall (${s.cm}).`),
      "Not sure? Email a height and we will pick for you.",
    ],
  },
  {
    id: "delivery",
    title: "Shipping & returns",
    body: [
      "We ship to all 50 states and DC. Standard shipping is free on every kit and arrives in 5 to 7 business days. Express is $12 and arrives in 2 to 3 business days. Orders placed before 2 pm ET on a weekday leave the same day.",
      "Returns are free for 30 days. Send back an unworn shirt or an unopened set for a full refund, or swap a size at no cost. Start a return from your order email, or write to hello@playweary.com with your order number.",
    ],
  },
  {
    id: "fabric",
    title: "Fabric & care",
    body: [
      "220 GSM combed cotton, OEKO-TEX Standard 100 certified. Soft hook-and-loop patches are stitched, not glued, so they stay put.",
      "Machine wash cold, inside out, with the pieces on or off. Tumble dry low or hang to dry. No bleach. We washed one shirt 40 times and photographed it every tenth wash: the print and the patches held, and the colour barely moved.",
    ],
  },
  {
    id: "safety",
    title: "Safety",
    body: [
      "Does it scratch? The loop side is on the shirt, the soft side faces your child, and every edge is bound, so nothing hard touches skin.",
      "Does it catch hair? The hook side lives on the back of each piece only and sits flat against the shirt when worn.",
      "Small parts: the pieces are made for ages 3 and up. Keep loose pieces away from babies and younger siblings, and store them in the box between plays.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      "Email hello@playweary.com or call (555) 014-2219, Monday to Friday, 9 am to 5 pm ET. We reply within one business day.",
      "Playweary, 418 Hudson Street, Suite 3, New York, NY 10014.",
    ],
  },
];
