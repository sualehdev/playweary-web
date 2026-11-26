/**
 * The standalone information and policy pages (one URL each, linked from the
 * footer of every page). Draft copy: have a lawyer review the legal pages
 * before ads run. Business facts come from ./business; shipping numbers come
 * from lib/checkout so the page can never disagree with the checkout.
 */

import { SHIPPING } from "@/lib/checkout";
import { shipPrice } from "@/lib/settings";
import { BUSINESS, hasTodos } from "./business";

export type Section = { h?: string; p?: string[]; ul?: string[]; table?: "sizes" };
export type PageKind = "legal" | "commerce" | "reference" | "faq" | "editorial";
export type Fact = { value: string; label: string };
export type Step = { h: string; p: string };
export type PolicyPage = {
  slug: string;
  /** Page heading and <title>. */
  title: string;
  /** Footer link text. */
  link: string;
  description: string;
  /** Legal pages show an effective date. */
  legal?: boolean;
  /** Decides the layout: numbered legal reading, fact cards, tables, accordions or editorial. */
  kind: PageKind;
  /** "The short version": a few plain bullets above the full text. */
  summary?: string[];
  /** Big key-fact cards under the heading. */
  facts?: Fact[];
  /** A numbered how-to timeline under the heading. */
  steps?: Step[];
  /** Slugs of related pages, shown at the bottom. */
  related?: string[];
  sections: Section[];
};

const [standard] = SHIPPING;
const email = BUSINESS.email;
/** Until the real legal entity is filled in, name the brand rather than show a placeholder. */
const legalName = BUSINESS.legalName;
const who = BUSINESS.legalName;

/** The pages, with Standard shipping priced at `shipCents` (an admin setting; see lib/settings). */
export const policiesFor = (shipCents: number): PolicyPage[] => [
  {
    slug: "privacy-policy",
    kind: "legal",
    summary: ["Our site is for grown-ups. We do not knowingly collect personal information from children.", "We use your details to process orders and to answer you.", "Marketing and analytics tags stay off until you accept them.", "California residents can ask to know, correct or delete their information."],
    related: ["cookie-policy", "terms-of-service", "contact"],
    title: "Privacy Policy",
    link: "Privacy Policy",
    description: "What Playweary collects, why, who we share it with, and the choices you have, including for California residents and children.",
    legal: true,
    sections: [
      { p: [`${who} runs playweary.com. This policy explains what we collect when you visit, order or sign up, and what we do with it. Questions: ${email}.`] },
      {
        h: "Our site is for grown-ups",
        p: [
          "Playweary sells children's clothing, but the website, checkout and emails are for parents and carers. We do not knowingly collect personal information from children under 13. If you think a child has given us their details, write to us and we will delete them.",
          "We do not send information about children to advertising platforms. The only details we hold about a child are the size you choose for the kit.",
        ],
      },
      {
        h: "What we collect",
        ul: [
          "Order details: name, email, phone number, delivery address, the kits and sizes you order.",
          "Newsletter: your email address, if you sign up.",
          "Messages: what you send us by email.",
          "Device and usage data: pages viewed, device type and approximate location, collected through cookies and similar tools (see our Cookie Policy). Advertising and analytics tags only run after you agree.",
        ],
      },
      {
        h: "How we use it",
        ul: [
          "To take, deliver and support your order, and to send your receipt and tracking updates.",
          "To send the newsletter, only if you asked for it. Every email has an unsubscribe link.",
          "To keep the site secure and prevent fraud and spam.",
          "To measure and improve the site and, with your consent, our advertising.",
        ],
      },
      {
        h: "Who we share it with",
        p: ["We do not sell your personal information for money. We share it only with providers who help us run the store, under their own privacy terms:"],
        ul: [
          "Delivery carriers, to deliver your order.",
          "Hosting, email and customer-service tools.",
          "Payment providers, once online payment is switched on (see our Payment Policy).",
          "Google and Meta, for analytics and advertising measurement, only if you accept marketing cookies.",
          "Authorities, where the law requires it.",
        ],
      },
      {
        h: "How long we keep it",
        p: ["Order records are kept for as long as tax and accounting law requires. Newsletter addresses are kept until you unsubscribe. Messages are kept for as long as needed to help you."],
      },
      {
        h: "Your choices and rights",
        p: [
          `You can ask to see, correct or delete the personal information we hold about you, or to stop us using it for marketing, by writing to ${email}. We will answer within 45 days.`,
          "California residents have the right to know, delete and correct their personal information, and to opt out of its sale or sharing for cross-context advertising. We do not sell personal information for money. To opt out of sharing for advertising, decline marketing cookies in the cookie settings or write to us, and we will not discriminate against you for using these rights.",
        ],
      },
      { h: "Security", p: ["We use encrypted connections and limit who can see order data. No system is perfectly secure, so we cannot promise absolute security."] },
      { h: "Changes", p: ["If we change this policy we will update the date at the top of this page."] },
      { h: "Contact", p: [`${legalName}. ${email}.`] },
    ],
  },
  {
    slug: "terms-of-service",
    kind: "legal",
    related: ["payment-policy", "returns-refunds", "privacy-policy"],
    title: "Terms of Service",
    link: "Terms of Service",
    description: "The terms for using playweary.com and buying from Playweary.",
    legal: true,
    sections: [
      { p: [`These terms cover your use of playweary.com and any order you place with ${who}. By ordering or using the site you agree to them.`] },
      {
        h: "Orders",
        ul: [
          "An order is an offer to buy. We accept it when we confirm it by email. We may decline or cancel an order, for example for an out-of-stock item, a pricing error or suspected fraud, and will tell you if we do.",
          "You must be 18 or older and ordering for delivery within the United States.",
          "Prices are in US dollars. Sales tax, where it applies, is included in the price shown.",
        ],
      },
      { h: "Payment", p: ["Payment methods are described in our Payment Policy."] },
      { h: "Shipping and returns", p: ["Delivery is covered by our Shipping Policy and returns by our Returns & Refunds Policy. Both form part of these terms."] },
      { h: "Product use and safety", p: ["Playweary kits are made for ages 3 and up and contain small pieces. Follow the age grading and the care label, and keep loose pieces away from babies and younger siblings. Adult supervision is advised."] },
      { h: "Our content", p: ["The Playweary name, characters, artwork and site content belong to us or our licensors. You may use them for personal, non-commercial purposes only, and may not copy or resell them without written permission."] },
      { h: "Liability", p: ["To the extent the law allows, we are not liable for indirect or consequential loss. Nothing in these terms limits liability that cannot be limited by law, or your statutory consumer rights."] },
      { h: "Governing law", p: ["These terms are governed by the laws of the State of New York. Disputes will be heard in the courts of New York County, unless the law gives you the right to bring a claim elsewhere."] },
      { h: "Contact", p: [`${legalName}. ${email}.`] },
    ],
  },
  {
    slug: "payment-policy",
    kind: "legal",
    summary: ["Cash on delivery is the payment method for now.", "You pay the courier when your parcel arrives.", "No extra charges at the door."],
    related: ["shipping-policy", "returns-refunds", "terms-of-service"],
    title: "Payment Policy",
    link: "Payment Policy",
    description: "How you pay for a Playweary order, what we charge, and when you are charged.",
    sections: [
      {
        h: "Accepted payment",
        p: [
          "Right now you pay by cash on delivery: place your order, then hand the courier the total in cash when your kit arrives. Please have the exact amount ready. You are not charged anything online.",
          "PayPal and card payment will be added when the store opens to online payment. This page will be updated first.",
        ],
      },
      {
        h: "What you pay",
        ul: [
          "The price of each kit, shown in US dollars.",
          `Shipping: ${standard.name} is ${shipPrice(shipCents)}.`,
          "Sales tax, where it applies, is included in the price. The total at checkout is the total you pay.",
        ],
      },
      {
        h: "Refunds",
        p: ["Because cash orders are paid on delivery, an eligible refund is sent back to you by a method we agree with you (for example PayPal or bank transfer) within 3 to 5 business days of us receiving the return. See the Returns & Refunds Policy."],
      },
      {
        h: "Problems with an order",
        p: [`If the amount asked for does not match your order confirmation, do not pay, and email ${email} with your order number.`],
      },
    ],
  },
  {
    slug: "shipping-policy",
    kind: "commerce",
    facts: [
      { value: shipPrice(shipCents), label: `${standard.name}, ${standard.days[0]} to ${standard.days[1]} business days` },
      { value: "2 pm ET", label: "Order before this and it usually ships the same day" },
      { value: "All 50 states", label: "Plus Washington, DC" },
    ],
    related: ["returns-refunds", "faq", "contact"],
    title: "Shipping Policy",
    link: "Shipping Policy",
    description: "Where Playweary ships, delivery speeds and costs, and what happens if something goes wrong.",
    sections: [
      {
        h: "Where we ship",
        p: ["We ship to all 50 US states and Washington, DC, including PO boxes where the carrier allows. We do not ship internationally or to APO/FPO addresses yet."],
      },
      {
        h: "Speed and cost",
        ul: [
          `${standard.name}: ${standard.days[0]} to ${standard.days[1]} business days, ${shipPrice(shipCents).toLowerCase()}.`,
        ],
        p: ["Delivery times start when your order ships, not when you place it."],
      },
      {
        h: "Processing",
        p: ["Orders placed before 2 pm ET on a business day usually leave the same day. Orders placed later or at weekends leave the next business day. If something is on backorder we say so at checkout and in your confirmation, and email you when it ships."],
      },
      { h: "Tracking", p: ["You get an order number and a private tracking link when you order, and you can follow your kit any time on the Track order page."] },
      { h: "Lost or damaged parcels", p: [`If your parcel has not arrived 3 business days after the latest delivery date, or arrives damaged, email ${email} with your order number and we will send a replacement or refund.`] },
      { h: "Taxes", p: ["Sales tax, where it applies, is included in the price. There are no extra charges when your parcel arrives."] },
    ],
  },
  {
    slug: "returns-refunds",
    kind: "commerce",
    facts: [
      { value: "30 days", label: "From delivery to start a return" },
      { value: "Free", label: "Prepaid return label" },
      { value: "3 to 5 days", label: "To refund once we get it" },
    ],
    steps: [
      { h: "Email us", p: `Send your order number and what you would like to return or swap to ${email}.` },
      { h: "Get your label", p: "We reply within one business day with a prepaid label and instructions." },
      { h: "Send it back", p: "Pack it up and drop it with the carrier. Shirts unworn, sets unopened." },
      { h: "Get your refund", p: "Once the parcel reaches us we check it and refund within 3 to 5 business days." },
    ],
    related: ["shipping-policy", "faq", "contact"],
    title: "Returns & Refunds",
    link: "Returns & Refunds",
    description: "Playweary's 30-day returns on unworn and unopened items, how to start one, and how refunds work.",
    sections: [
      {
        h: "30-day returns on unworn and unopened items",
        p: ["You have 30 days from the day your order is delivered to send back an unworn shirt or an unopened set for a refund, or to swap a size at no cost."],
      },
      {
        h: "What can come back",
        ul: [
          "Shirts that are unworn, unwashed and have their tags.",
          "Hair, outfit and shoe sets that are unopened in their packaging.",
          "Anything that arrives damaged or faulty, at any time within 30 days, even if opened.",
        ],
      },
      { h: "Return shipping", p: ["Returns are free. We email a prepaid label for an unworn or unopened return, a size swap, or a damaged or faulty item."] },
      {
        h: "Refunds",
        p: ["Once the parcel reaches us we check it and process the refund within 3 to 5 business days. The refund goes to your original payment method. For cash-on-delivery orders we agree a method with you (see the Payment Policy). Original shipping is refunded if the return is for a damaged or faulty item."],
      },
    ],
  },
  {
    slug: "contact",
    kind: "editorial",
    title: "Contact Us",
    link: "Contact Us",
    description: "Email Playweary or send us a message. We reply within one business day.",
    sections: [
      {
        p: [`Email: ${email}`, `Hours: ${BUSINESS.hours}`, `We reply within ${BUSINESS.replyTime}.`],
      },
      { h: "Order questions", p: ["Please include your order number so we can find it quickly. To see where an order is, use the Track order page."] },
    ],
  },
  {
    slug: "about",
    kind: "editorial",
    related: ["faq", "returns-refunds", "contact"],
    title: "About Playweary",
    link: "About Us",
    description: "Who is behind Playweary, what we make and why.",
    sections: [
      { p: [`Playweary is a children's clothing brand from ${who}.`] },
      {
        h: "What we make",
        p: ["One printed character on the shirt, plus velcro hair, outfits and shoes that rip off and stick back on. Every kit comes with the shirt and all three sets, and it all goes in the same wash. Kids dress their own character, then swap it again."],
      },
      { h: "Get in touch", p: [`Email us at ${email}. We reply within ${BUSINESS.replyTime}.`] },
    ],
  },
  {
    slug: "faq",
    kind: "faq",
    related: ["shipping-policy", "returns-refunds", "contact"],
    title: "FAQ",
    link: "FAQ",
    description: "Quick answers about Playweary kits, sizing, delivery, returns and care.",
    sections: [
      { h: "What comes in a kit?", p: ["One printed character shirt plus three sets of velcro pieces (hair, outfit and shoes)."] },
      { h: "What size should I pick?", p: ["Go by your child's height, using the size table on each product page. Between sizes, go up."] },
      { h: "How much is delivery?", p: [`Standard shipping is ${shipPrice(shipCents).toLowerCase()} and takes ${standard.days[0]} to ${standard.days[1]} business days.`] },
      { h: "How do I pay?", p: ["By cash on delivery for now. See the Payment Policy."] },
      { h: "Can I return it?", p: ["Yes: 30 days from delivery for unworn shirts and unopened sets. See Returns & Refunds."] },
      { h: "Can it go in the wash?", p: ["Yes. Machine wash cold, inside out. Tumble dry low or hang to dry, and do not bleach."] },
      { h: "What age is it for?", p: ["Ages 3 and up. It has small parts, so keep loose pieces away from babies and younger siblings."] },
      { h: "How do I track my order?", p: ["Use the private link in your confirmation email, or the Track order page."] },
    ],
  },
  {
    slug: "cookie-policy",
    kind: "legal",
    summary: ["Essential cookies keep your basket and checkout working.", "Analytics and advertising cookies stay off until you accept them.", "You can change your choice any time with the Cookie settings link in the footer."],
    related: ["privacy-policy", "terms-of-service", "contact"],
    title: "Cookie Policy",
    link: "Cookie Policy",
    description: "The cookies and similar tools Playweary uses and how to control them.",
    legal: true,
    sections: [
      { p: ["Cookies are small files a site stores in your browser. We use them to make the store work and, if you agree, to measure and advertise."] },
      {
        h: "What we use",
        ul: [
          "Essential: keep your basket and checkout working. These do not need consent.",
          "Analytics (Google): count visits and show which pages help. Only after you accept.",
          "Advertising (Google, Meta): measure whether our ads lead to orders. Only after you accept.",
        ],
      },
      { h: "Your choice", p: ["Marketing and analytics tags are off until you accept them. You can change your choice any time with the Cookie settings link at the bottom of every page, or through your browser's settings. Turning off advertising cookies opts you out of the sharing of your data for advertising, and you can also write to us."] },
      { h: "More", p: ["See our Privacy Policy for how we handle personal information."] },
    ],
  },
];

/** Sections safe to show: any that still contain a [TODO: ...] placeholder are left out. */
export const visibleSections = (p: PolicyPage): Section[] =>
  p.sections.filter((s) => !hasTodos([s.h ?? "", ...(s.p ?? []), ...(s.ul ?? [])].join(" ")));

/** Static lookups (footer labels, sitemap) use the default rate; pages render with the live one. */
export const POLICIES = policiesFor(standard.price * 100);

export const POLICY_BY_SLUG =Object.fromEntries(POLICIES.map((p) => [p.slug, p]));

/** The footer link order: the legal set first, then the help pages. */
export const FOOTER_ORDER = [
  "privacy-policy",
  "terms-of-service",
  "payment-policy",
  "shipping-policy",
  "returns-refunds",
  "about",
  "contact",
  "faq",
  "cookie-policy",
] as const;
