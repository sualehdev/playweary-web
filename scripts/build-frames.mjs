#!/usr/bin/env node
/**
 * Bakes the placeholder scroll-sequence art (scripts/frames/artwork.ts) into
 * numbered WebP files, so the browser decodes images instead of rasterising 72
 * SVGs at runtime. Replace the files in public/frames with a real render and
 * nothing else changes.
 *
 *   npm run frames
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "frames");
const WIDTHS = [960, 1280];

const art = await import(pathToFileURL(path.join(ROOT, "scripts/frames/artwork.ts")).href);
const { FRAME_COUNT } = await import(pathToFileURL(path.join(ROOT, "src/content/swap.ts")).href);
if (art.FRAME_COUNT !== FRAME_COUNT) throw new Error(`artwork has ${art.FRAME_COUNT} frames, swap.ts says ${FRAME_COUNT}`);

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
let bytes = 0;
for (let i = 0; i < FRAME_COUNT; i++) {
  const uri = art.frameAt(i / (FRAME_COUNT - 1));
  const svg = decodeURIComponent(uri.slice(uri.indexOf(",") + 1));
  for (const w of WIDTHS) {
    const buf = await sharp(Buffer.from(svg), { density: 144 }).resize({ width: w }).webp({ quality: 80, effort: 4 }).toBuffer();
    bytes += buf.length;
    await fs.writeFile(path.join(OUT, `swap-${String(i + 1).padStart(4, "0")}-${w}.webp`), buf);
  }
}
console.log(`wrote ${FRAME_COUNT * WIDTHS.length} frames to public/frames (${(bytes / 1024 / 1024).toFixed(1)} MB total, both sizes)`);
