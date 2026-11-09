/**
 * What goes where. `npm run assets` reads this, cleans each source, and writes
 * trimmed WebP into public/art plus a manifest the app imports.
 *
 * Sources live outside the repo (the designer's folders). Point PW_SOURCE_DIR
 * at the folder that holds "Characters Elements" and "Play Weary Website
 * Elements" if it is not the repo's parent.
 */

/** Piece widths / base heights written for each asset (never upscaled). */
export const PIECE_WIDTHS = [256, 640];
export const BASE_HEIGHTS = [640, 1280];

/** Where the characters sit on the shirt print, in % of the print. */
export const PRINT = { w: 520, h: 669, cx: 53.56, charTop: 18.83, charBottom: 81.17 };

/** Slot order on screen: later entries sit on top. */
export const Z = { outfit: 2, shoes: 3, hair: 4, bag: 5 };

/** Kept: the Boy-Hairs_* file of each pair is the crisper export. */
const B = "Characters Elements/Boy/";
const G = "Characters Elements/Girl/";

export const characters = {
  boy: {
    base: B + "Base Character.png",
    // Hair/outfit/shoes N all belong to set N.
    pieces: [
      { id: "hair1", type: "hair", set: 1, name: "Surf Shades", src: B + "Boy-Hairs_0002_Hairs_1.png" },
      { id: "hair2", type: "hair", set: 2, name: "Sky Goggles", dy: -4.4, src: B + "Boy-Hairs_0001_Hairs_2.png" },
      { id: "hair3", type: "hair", set: 3, name: "Cool Spikes", dy: -4.2, src: B + "Boy-Hairs_0000_Hairs_3.png" },
      { id: "outfit1", type: "outfit", set: 1, name: "Bolt Hoodie", src: B + "Attire_0002_Attire_1.png" },
      { id: "outfit2", type: "outfit", set: 2, name: "Match Kit", dy: 1.5, src: B + "Attire_0001_Attire_2.png" },
      { id: "outfit3", type: "outfit", set: 3, name: "Scout Shirt", dy: -0.8, src: B + "Attire_0000_Attire_3.png" },
      { id: "shoes1", type: "shoes", set: 1, name: "Court Hi-Tops", src: B + "Untitled-1_0002_Shoes_1.png" },
      { id: "shoes2", type: "shoes", set: 2, name: "Turbo Trainers", src: B + "Untitled-1_0001_Shoes_2.png" },
      { id: "shoes3", type: "shoes", set: 3, name: "Trail Boots", src: B + "Untitled-1_0000_Shoes_3.png" },
    ],
    // On disk but deliberately unused. The build proves each claim below.
    skip: [
      { src: B + "Boy-Hairs_0003_Background.png", why: "blank (solid white fill)", duplicateOf: null },
      { src: B + "Untitled-1_0000_Hairs_2.png", why: "near-duplicate, softer re-export", duplicateOf: "hair2" },
      { src: B + "Untitled-1_0001_Hairs_1.png", why: "near-duplicate, softer re-export", duplicateOf: "hair1" },
    ],
    // `dy` / `dx` on a piece nudge it, in % of the print height / width.
    // Outfits share one centre but differ in height, so the tall and short ones
    // are nudged to keep the collar at the neck.
    // Boy placement is the concept page's hand-tuned atlas, kept as-is.
    slots: {
      hair: { cy: 25.4, w: 23 },
      outfit: { cy: 54.05, w: 35.58 },
      shoes: { cy: 78.36, w: 26.33 },
    },
  },
  girl: {
    base: G + "Base Character.png",
    // Her base wears a white strapless dress. Under a dress with cut-away sides
    // (the gown) it shows through as a pale patch, so a second base is made with
    // that dress painted skin-coloured, for use whenever she is wearing an outfit.
    // The band runs down past the skirt hem, which peeks out of side slits.
    bare: { fromY: 0.24, toY: 0.64, skin: [250, 170, 101], minLight: 175, maxChroma: 60 },
    // The girl's colourways pair up across categories: the number in a
    // filename does not match across them, so each set is listed by hand.
    pieces: [
      { id: "hair1", type: "hair", set: 1, name: "Garden Hat", src: G + "Floral Straw Hat with Wavy Hair.png" },
      { id: "hair2", type: "hair", set: 2, name: "Meadow Hat", src: G + "Olive Straw Hat with Wavy Brown Hair.png" },
      { id: "hair3", type: "hair", set: 3, name: "Denim Hat", src: G + "Straw Hat and Wavy Brown Hair Cutout.png" },
      { id: "outfit1", type: "outfit", set: 1, name: "Garden Gown", dx: 0.8, dy: -1.4, src: G + "Dress_1.png" },
      { id: "outfit2", type: "outfit", set: 2, name: "Meadow Top & Jeans", dy: -0.8, src: G + "Dress_2.png" },
      { id: "outfit3", type: "outfit", set: 3, name: "Denim Day", src: G + "Dress_3.png" },
      { id: "bag1", type: "bag", set: 1, name: "Garden Bag", src: G + "Handbag_2.png" },
      { id: "bag2", type: "bag", set: 2, name: "Meadow Bag", src: G + "Handbag_1.png" },
      { id: "bag3", type: "bag", set: 3, name: "Denim Bag", src: G + "Handbag_3.png" },
      { id: "shoes1", type: "shoes", set: 1, name: "Cream Flats", src: G + "Shoes_0002_Shoes-copy.png" },
      { id: "shoes2", type: "shoes", set: 2, name: "Olive Flats", src: G + "Shoes_0001_Shoes-2.png" },
      { id: "shoes3", type: "shoes", set: 3, name: "Court Sneakers", src: G + "Shoes_0000_Shoes.png" },
    ],
    skip: [],
    // Placement is derived from the base silhouette (see build-assets.mjs) and
    // nudged here. Fractions of the trimmed base character; dy moves a piece
    // down by that fraction of the base height.
    fit: {
      /** Multiplier on true scale (1 = the cut-outs' own proportions to the base). */
      enlarge: { hair: 1, outfit: 1, shoes: 1, bag: 1.1 },
      hair: { topAt: -0.02, dy: 0 },
      outfit: { topAt: 0.235, dy: 0 },
      shoes: { bottomAt: 1.0, dy: 0 },
      // hangs from her hand: handle at hand height, centred just inside the fingertips
      bag: { cx: 0.13, topAt: 0.5, dy: 0 },
    },
  },
};

/** Brand art pulled out of playweary-homepage-v3.html (in PW_SOURCE_DIR). */
export const brand = {
  logo_light: { widths: [380, 760] },
  logo_dark: { widths: [380, 760] },
  tee_print: { widths: [520], note: "boy print only, 520px wide: ask for a hi-res, plus a girl print" },
};

/** Decorative SVGs from the PDF's artboards, copied verbatim (they are tiny). */
export const decor = {
  "Artboard 10.svg": "loop-arrow",
  "Artboard 11.svg": "squiggle-green-lg",
  "Artboard 14.svg": "tag-rip",
  "Artboard 15.svg": "tag-stick",
  "Artboard 16.svg": "tag-play",
  "Artboard 17.svg": "quote-bubble",
  "Artboard 18.svg": "squiggle-green-sm",
  "Artboard 19.svg": "dots-pink-sm",
  "Artboard 2.svg": "sky-gradient",
  "Artboard 20.svg": "squiggle-yellow-sm",
  "Artboard 3.svg": "wave-yellow",
  "Artboard 4.svg": "dots-multi-sm",
  "Artboard 5.svg": "hamburger",
  "Artboard 6.svg": "squiggle-green-xs",
  "Artboard 7.svg": "cart-badge",
  "Artboard 8.svg": "confetti",
  "Artboard 9.svg": "dots-pink-lg",
};
/** Not copied: Artboard 21 (10 MB embedded raster of the girl outfit flat-lay). */

/**
 * Art for the scroll-scrubbed show (src/content/show.lottie.json). The two
 * characters keep the Lottie's own height (its layers are keyframed against it)
 * and take their real aspect ratio for width. Every piece of both characters
 * is exported as well, at a fixed width, so the show can dress either of them
 * in any set.
 */
export const show = {
  boy: { height: 924, from: ["boy", "base"] },
  girl: { height: 924, from: ["girl", "base"] },
  girlBare: { height: 924, from: ["girl", "bare"] },
};
export const SHOW_PIECE_WIDTH = 480;
