#!/usr/bin/env node
/**
 * The jigsaw's picture: the girl in the full Meadow set, flattened into one
 * square image so the puzzle cuts a single finished picture, not loose layers.
 *
 *   npm run puzzle
 *
 * Reads the art `npm run assets` already wrote (public/art + the manifest), so
 * no designer sources are needed. Run it again after `npm run assets`.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "src", "content", "art-manifest.json"), "utf8"));
const OUT_DIR = path.join(ROOT, "public", "art", "puzzle");
const OUT = path.join(OUT_DIR, "meadow-girl.webp");

const SET = 2; // Meadow: olive hat, top & jeans, bag, flats
const SIDE = 1080; // 2x the 540-unit board
const MARGIN_TOP = 26;
const FEET_AT = 1032; // where her soles land on the board

const P = manifest.print;
const girl = manifest.characters.girl;
const file = (src) => path.join(ROOT, "public", src);
const largest = (vs) => vs.reduce((a, b) => (b.w > a.w ? b : a));

// 1. Dress her in print space, at a working size big enough to stay crisp.
const charH = 1400;
const H = Math.round(charH / ((P.charBottom - P.charTop) / 100));
const W = Math.round((H * P.w) / P.h);
const baseW = Math.round((charH * girl.base.w) / girl.base.h);
const layers = [
  {
    input: await sharp(file(largest(girl.base.bare.variants).src)).resize({ height: charH }).toBuffer(),
    left: Math.round((P.cx / 100) * W - baseW / 2),
    top: Math.round((P.charTop / 100) * H),
  },
];
const pieces = Object.values(girl.pieces)
  .filter((p) => p.set === SET)
  .sort((a, b) => a.z - b.z);
for (const p of pieces) {
  const pw = Math.round((p.slot.w / 100) * W);
  const { data, info } = await sharp(file(largest(p.variants).src)).resize({ width: pw }).toBuffer({ resolveWithObject: true });
  layers.push({ input: data, left: Math.round((p.slot.cx / 100) * W - pw / 2), top: Math.round((p.slot.cy / 100) * H - info.height / 2) });
}
const dressed = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(layers)
  .png()
  .toBuffer();
// trim to what is actually drawn
const trimmed = await sharp(dressed).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });

// 2. Fit her to the board, standing on the ground near the bottom edge.
const fitH = FEET_AT - MARGIN_TOP;
const scale = fitH / trimmed.info.height;
const fig = await sharp(trimmed.data).resize({ height: fitH }).png().toBuffer({ resolveWithObject: true });
const figLeft = Math.round((SIDE - fig.info.width) / 2);

// 3. The board behind her, same palette as the rest of the site.
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIDE}" height="${SIDE}" viewBox="0 0 540 540">
  <rect width="540" height="540" fill="#FFF1DE"/>
  <circle cx="270" cy="276" r="222" fill="#FFE0B8"/>
  <circle cx="72" cy="82" r="13" fill="#9F3EFF" opacity=".26"/>
  <circle cx="468" cy="98" r="9" fill="#FF2D60" opacity=".3"/>
  <circle cx="56" cy="450" r="10" fill="#81DF40" opacity=".38"/>
  <circle cx="486" cy="468" r="14" fill="#FCC006" opacity=".45"/>
  <ellipse cx="270" cy="${FEET_AT / 2 - 2}" rx="88" ry="11" fill="#200242" opacity=".1"/>
</svg>`;

await fs.mkdir(OUT_DIR, { recursive: true });
const out = await sharp(Buffer.from(bg))
  .composite([{ input: fig.data, left: figLeft, top: MARGIN_TOP }])
  .webp({ quality: 86, alphaQuality: 100, effort: 5 })
  .toBuffer({ resolveWithObject: true });
await fs.writeFile(OUT, out.data);
console.log(
  `puzzle  ${path.relative(ROOT, OUT)}  ${out.info.width}×${out.info.height}  ${Math.round(out.data.length / 1024)} KB` +
    `  (figure ${fig.info.width}×${fig.info.height}, scale ${scale.toFixed(3)}, pieces: ${pieces.map((p) => p.id).join(", ")})`
);
