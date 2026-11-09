/**
 * What the shop sells: two kits, one per character. Each kit is the shirt plus
 * all three of that character's sets, so the sets are never sold on their own.
 * Prices live here, and only here.
 */

import { type CharacterId, CHARACTERS } from "./characters";

/** A picture in a product card: a piece of a character, or the printed tee. */
export type Shot = { character: CharacterId; id: string } | "tee";

export type Product = {
  id: string;
  name: string;
  sub: string;
  price: number;
  was?: number;
  per?: string;
  shots: Shot[];
  looks: string;
  flag?: string;
  cta?: string;
  /** The character this kit is for. */
  character?: CharacterId;
};

export const CURRENCY = "USD";
export const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const KIT_PRICE = 40;

export const kitId = (c: CharacterId) => `kit-${c}`;

function kit(c: CharacterId): Product {
  const def = CHARACTERS[c];
  const pieces = def.sets.length * def.slots.length;
  return {
    id: kitId(c),
    name: c === "boy" ? "Boy Shirt Kit" : "Girl Shirt Kit",
    sub: `Shirt + all ${def.sets.length} sets, ${pieces} velcro pieces`,
    price: KIT_PRICE,
    shots: ["tee", ...def.sets.map((s) => ({ character: c, id: s.pieces[1] }))],
    looks: `${3 ** def.slots.length} complete looks`,
    character: c,
  };
}

export const PRODUCTS: Product[] = [kit("boy"), kit("girl")];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Products on show for a character: shared ones plus that character's own. */
export const productsFor = (c: CharacterId) =>
  PRODUCTS.filter((p) => !p.character || p.character === c);

/* -------------------------------------------------------------------- sizes -- */

/** Kids' sizes, chosen by height (a child between two sizes goes up). */
export type Size = { id: string; inches: string; cm: string };

export const SIZES: Size[] = [
  { id: "2T", inches: "33 to 35 in", cm: "84 to 89 cm" },
  { id: "3T", inches: "36 to 38 in", cm: "91 to 97 cm" },
  { id: "4T", inches: "39 to 41 in", cm: "99 to 104 cm" },
  { id: "5", inches: "42 to 44 in", cm: "107 to 112 cm" },
  { id: "6", inches: "45 to 47 in", cm: "114 to 119 cm" },
  { id: "7", inches: "48 to 50 in", cm: "122 to 127 cm" },
  { id: "8", inches: "51 to 53 in", cm: "130 to 135 cm" },
];

export const DEFAULT_SIZE = "5";
export const sizeById = (id: string) => SIZES.find((s) => s.id === id);

/* ------------------------------------------------------------------ colours -- */

/** Stock shirt colours. `line` is the outline, `collar` the neck rib. */
export type ShirtColour = { id: string; name: string; body: string; collar: string; line: string };

export const SHIRT_COLOURS: ShirtColour[] = [
  { id: "navy", name: "Navy", body: "#0B2243", collar: "#16395C", line: "#071A33" },
  { id: "ink", name: "Almost black", body: "#1E1E27", collar: "#32323E", line: "#0B0B10" },
  { id: "berry", name: "Berry", body: "#C81E3C", collar: "#E03552", line: "#8E1129" },
  { id: "forest", name: "Forest", body: "#17594A", collar: "#23755F", line: "#0D3A2F" },
  { id: "grape", name: "Grape", body: "#6A2FA0", collar: "#8544BF", line: "#45197A" },
  { id: "sand", name: "Sand", body: "#E5D2B0", collar: "#F1E5CF", line: "#B4A07C" },
];

/** Ink or cream, whichever stays readable on the given shirt (Rec. 709). */
export const readableOn = (hex: string) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? "#200242" : "#FFF7EF";
};
