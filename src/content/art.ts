/**
 * Typed access to the generated art manifest (`npm run assets`).
 * Paths in the manifest are relative to /public; everything here returns
 * root-relative URLs ready for an <img src>.
 */

import manifest from "./art-manifest.json";

export type CharacterId = "boy" | "girl";
export type SlotType = "hair" | "outfit" | "shoes" | "bag";

type Variant = { src: string; w: number; h: number; bytes: number };

/** Where a piece sits on the shirt print, as % of the print area. */
export type PieceSlot = { cx: number; cy: number; w: number; h: number };

export type PieceArt = {
  id: string;
  type: SlotType;
  set: number;
  name: string;
  z: number;
  /** Trimmed source size, for aspect ratio. */
  w: number;
  h: number;
  slot: PieceSlot;
  variants: Variant[];
};

export type BaseArt = { w: number; h: number; variants: Variant[]; /** Same figure with the base dress painted out, if there is one. */ bare?: { variants: Variant[] } };

const characters = manifest.characters as unknown as Record<
  CharacterId,
  { base: BaseArt; pieces: Record<string, PieceArt> }
>;

export const PRINT = manifest.print;

const url = (src: string) => "/" + src;

/** Smallest variant at least `width` wide, else the largest. */
function pick(variants: Variant[], width: number, axis: "w" | "h" = "w") {
  const sorted = [...variants].sort((a, b) => a[axis] - b[axis]);
  return sorted.find((v) => v[axis] >= width) ?? sorted[sorted.length - 1];
}

export const pieceArt = (character: CharacterId, id: string): PieceArt => {
  const p = characters[character].pieces[id];
  if (!p) throw new Error(`No ${character} piece "${id}" in the art manifest`);
  return p;
};

export const piecesOf = (character: CharacterId) => Object.values(characters[character].pieces);

/** URL of a piece at (at least) `width` CSS-px-times-DPR pixels wide. */
export const pieceSrc = (character: CharacterId, id: string, width = 256) =>
  url(pick(pieceArt(character, id).variants, width).src);

/** Width/height attributes that keep a piece at its true aspect ratio. */
export const pieceSize = (character: CharacterId, id: string, width = 256) => {
  const v = pick(pieceArt(character, id).variants, width);
  return { width: v.w, height: v.h };
};

export const baseArt = (character: CharacterId) => characters[character].base;
/** `bare`: the version without the base dress, for when an outfit covers her. */
export const baseSrc = (character: CharacterId, height = 640, bare = false) => {
  const base = characters[character].base;
  return url(pick(bare && base.bare ? base.bare.variants : base.variants, height, "h").src);
};

export type BrandKey = "logo_light" | "logo_dark" | "tee_print";
const brand = manifest.brand as unknown as Record<BrandKey, { w: number; h: number; variants: Variant[] }>;

export const brandSrc = (key: BrandKey, width = 760) => url(pick(brand[key].variants, width).src);
export const brandSize = (key: BrandKey) => ({ width: brand[key].w, height: brand[key].h });

/** Assets the Lottie show swaps in, keyed by the Lottie asset id. */
export const showAssets = manifest.show as unknown as Record<
  string,
  { src: string; w: number; h: number }
>;

export const decorSrc = (name: keyof typeof manifest.decor) => url(manifest.decor[name].src);
