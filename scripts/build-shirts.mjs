#!/usr/bin/env node
/**
 * Shirt photos: the designer's PNGs in the "PW" folder → WebP in public/shirts.
 *
 *   npm run shirts
 *
 * Point PW_SHIRTS_DIR at the folder if it is not "PW" next to the repo. Each
 * image is written at two widths, and src/content/shirts.ts lists the files.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(process.env.PW_SHIRTS_DIR ?? path.join(ROOT, "..", "PW"));
const OUT = path.join(ROOT, "public", "shirts");
const WIDTHS = [640, 1100];

/** output name -> source file */
const SHIRTS = {
  "boy-teal": "Boy Shirt_Teal Dress.png",
  "boy-blue": "Boy Shirt_Blue Dress.png",
  "boy-safari": "Boy Shirt_Safari Dress.png",
  "girl-pink": "Girl Shirt_Pink Dress.png",
  "girl-blue": "Girl Shirt_Blue Dress.png",
  "girl-green": "Girl Shirt_Green Dress.png",
};

await fs.mkdir(OUT, { recursive: true });
for (const [name, file] of Object.entries(SHIRTS)) {
  const input = sharp(path.join(SRC, file));
  const { width, height } = await input.metadata();
  for (const w of WIDTHS) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    await input.clone().resize({ width: Math.min(w, width), withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  }
  console.log(`${name}: ${width}x${height}`);
}
