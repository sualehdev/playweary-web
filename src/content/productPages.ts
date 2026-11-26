/**
 * The two product pages (/products/boy-shirt-kit and /products/girl-shirt-kit).
 * Names, prices and stock come from content/products and the live catalogue;
 * this file holds the page-only facts.
 */

import { CHARACTERS, type CharacterId } from "./characters";
import { SHIRTS } from "./shirts";

export type ProductPage = { slug: string; character: CharacterId };

export const PRODUCT_PAGES: ProductPage[] = [
  { slug: "boy-shirt-kit", character: "boy" },
  { slug: "girl-shirt-kit", character: "girl" },
];

export const productPageFor = (c: CharacterId) => PRODUCT_PAGES.find((p) => p.character === c)!;
export const productPageBySlug = (slug: string) => PRODUCT_PAGES.find((p) => p.slug === slug);
export const productPath = (c: CharacterId) => `/products/${productPageFor(c).slug}`;

export const BRAND = "Playweary";

/** Facts the page states. Add `origin` or `weight` here once confirmed and the product page shows them. */
export const PRODUCT_FACTS = {
  fabric: "220 GSM combed cotton, with soft hook-and-loop patches stitched on, not glued.",
  fibre: "100% cotton shirt body",
  age: "Ages 3 and up",
};

export const describe = (c: CharacterId) => {
  const def = CHARACTERS[c];
  const who = c === "boy" ? "boys" : "girls";
  const pieces = def.sets.length * def.slots.length;
  return `A long-sleeve ${who}' shirt with one printed character, plus ${pieces} velcro pieces (hair, outfit${c === "girl" ? ", bag" : ""} and shoes in ${def.sets.length} sets) that rip off and stick back on. One kit, one wash, endless looks.`;
};

/** Named pieces in the kit, grouped by set number, for the "what's in the box" list. */
export const kitPieces = (c: CharacterId) => CHARACTERS[c].pieces;

export const productImages = (c: CharacterId) => SHIRTS[c].map((s) => s.id);
