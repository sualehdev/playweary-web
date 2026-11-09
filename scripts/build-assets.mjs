#!/usr/bin/env node
/**
 * Artwork pipeline: designer sources → trimmed WebP in public/art + a manifest.
 *
 *   npm run assets
 *
 * What it does, in order:
 *   1. Proves the config's claims about the sources (blank layers are blank,
 *      "duplicates" really are duplicates) so a re-export cannot slip through.
 *   2. Trims every cut-out to its visible pixels and writes 1x/2x WebP.
 *   3. Works out where each piece sits on the printed character (print %).
 *   4. Pulls the brand art out of the original concept HTML and copies the
 *      PDF's decorative SVGs.
 *   5. Writes src/content/art-manifest.json and preview composites in
 *      .asset-preview/ so placement can be checked by eye.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BASE_HEIGHTS, PIECE_WIDTHS, PRINT, SHOW_PIECE_WIDTH, Z, brand, characters, decor, show } from "./asset-config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(process.env.PW_SOURCE_DIR ?? path.join(ROOT, ".."));
const OUT = path.join(ROOT, "public", "art");
const PREVIEW = path.join(ROOT, ".asset-preview");
const MANIFEST = path.join(ROOT, "src", "content", "art-manifest.json");

const log = (...a) => console.log(...a);
let manifestBrand;
const round = (n, d = 2) => Number(n.toFixed(d));

/** Alpha above this counts as visible when trimming. */
const ALPHA_MIN = 16;

async function readRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Bounding box of visible pixels, or null if there are none. */
function visibleBox({ data, w, h }) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** True if every visible pixel is the same colour: a fill, not artwork. */
function isFlat({ data, w, h }) {
  let first = null;
  for (let i = 0; i < w * h * 4; i += 4) {
    if (data[i + 3] <= ALPHA_MIN) continue;
    first ??= [data[i], data[i + 1], data[i + 2]];
    if (data[i] !== first[0] || data[i + 1] !== first[1] || data[i + 2] !== first[2]) return false;
  }
  return true;
}

/** Tiny fingerprint: 24×24 RGBA after flattening to the same canvas. */
async function fingerprint(file) {
  return sharp(file).ensureAlpha().resize(24, 24, { fit: "fill" }).raw().toBuffer();
}

async function verifySkips(name, cfg) {
  for (const s of cfg.skip) {
    const file = path.join(SRC, s.src);
    if (s.why.startsWith("blank")) {
      const raw = await readRaw(file);
      if (visibleBox(raw) && !isFlat(raw)) throw new Error(`${s.src} is listed as blank but has a picture in it`);
    } else {
      const twin = cfg.pieces.find((p) => p.id === s.duplicateOf);
      const [a, b] = await Promise.all([fingerprint(file), fingerprint(path.join(SRC, twin.src))]);
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i]);
      // These are re-exports of the same cut-out (same size, softer edges), not
      // byte copies, so "duplicate" means close, not identical.
      if (diff / a.length > 12) throw new Error(`${s.src} is listed as a duplicate of ${s.duplicateOf} but differs`);
    }
    log(`  skip  ${name}/${path.basename(s.src)} (${s.why})`);
  }
}

/** Trim one source and write its sized WebP files. Returns the manifest entry. */
async function emit({ file, outDir, stem, axis, sizes, quality = 82, recolor }) {
  const raw = await readRaw(file);
  const box = visibleBox(raw);
  if (!box) throw new Error(`${file} has no visible pixels`);
  if (recolor) recolor(raw, box);
  const source = () => (recolor ? sharp(raw.data, { raw: { width: raw.w, height: raw.h, channels: 4 } }) : sharp(file).ensureAlpha());
  const trimmed = () => source().extract(box);
  const variants = [];
  for (const size of sizes) {
    const natural = axis === "w" ? box.width : box.height;
    if (size > natural && variants.length) continue; // never upscale past the first fit
    const target = Math.min(size, natural);
    const resize = axis === "w" ? { width: target } : { height: target };
    const name = `${stem}-${target}.webp`;
    const buf = await trimmed()
      .resize({ ...resize, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 92, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    await fs.writeFile(path.join(outDir, name), buf.data);
    variants.push({ src: `${path.relative(path.join(ROOT, "public"), outDir).replaceAll("\\", "/")}/${name}`, w: buf.info.width, h: buf.info.height, bytes: buf.data.length });
  }
  return { w: box.width, h: box.height, variants };
}

/** Where a piece sits on the print, as % of the print: centre x/y and width. */
function boySlot(cfg, piece, ent) {
  const s = cfg.slots[piece.type];
  return { cx: round(PRINT.cx + (piece.dx ?? 0)), cy: round(s.cy + (piece.dy ?? 0)), w: s.w, h: round((s.w * ent.h) / ent.w * (PRINT.w / PRINT.h)) };
}

function girlSlot(cfg, base, piece, ent) {
  const f = cfg.fit;
  const charH = ((PRINT.charBottom - PRINT.charTop) / 100) * PRINT.h; // px on the print
  const s = (charH / base.h) * f.enlarge[piece.type]; // source px → print px
  const pw = ent.w * s;
  const ph = ent.h * s;
  const topPx = (PRINT.charTop / 100) * PRINT.h;
  const botPx = (PRINT.charBottom / 100) * PRINT.h;
  const cxPx = (PRINT.cx / 100) * PRINT.w;
  const rule = f[piece.type];
  let cx = cxPx;
  let cy;
  if (piece.type === "hair") cy = topPx + rule.topAt * charH + ph / 2;
  else if (piece.type === "outfit") cy = topPx + rule.topAt * charH + ph / 2;
  else if (piece.type === "shoes") cy = botPx * rule.bottomAt - ph / 2;
  else {
    cx = cxPx - (0.5 - rule.cx) * base.w * (charH / base.h);
    cy = topPx + rule.topAt * charH + ph / 2;
  }
  cx += ((piece.dx ?? 0) / 100) * PRINT.w;
  cy += (rule.dy ?? 0) * charH + ((piece.dy ?? 0) / 100) * PRINT.h;
  return {
    cx: round((cx / PRINT.w) * 100),
    cy: round((cy / PRINT.h) * 100),
    w: round((pw / PRINT.w) * 100),
    h: round((ph / PRINT.h) * 100),
  };
}

async function buildCharacter(name, cfg) {
  const outDir = path.join(OUT, name);
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  log(`\n${name}`);
  await verifySkips(name, cfg);

  const base = await emit({ file: path.join(SRC, cfg.base), outDir, stem: "base", axis: "h", sizes: BASE_HEIGHTS });
  log(`  base   ${base.w}×${base.h} → ${base.variants.map((v) => `${v.w}×${v.h}`).join(", ")}`);
  if (cfg.bare) {
    const { fromY, toY, skin, minLight, maxChroma } = cfg.bare;
    // pale, low-saturation pixels inside the dress band (its shaded edges too) become skin
    const paint = (raw, box) => {
      const y0 = Math.round(box.top + fromY * box.height);
      const y1 = Math.round(box.top + toY * box.height);
      for (let y = y0; y < y1; y++)
        for (let x = 0; x < raw.w; x++) {
          const i = (y * raw.w + x) * 4;
          const [r, g, b, a] = [raw.data[i], raw.data[i + 1], raw.data[i + 2], raw.data[i + 3]];
          if (a > ALPHA_MIN && Math.min(r, g, b) > minLight && Math.max(r, g, b) - Math.min(r, g, b) < maxChroma) {
            raw.data[i] = skin[0];
            raw.data[i + 1] = skin[1];
            raw.data[i + 2] = skin[2];
          }
        }
    };
    base.bare = await emit({ file: path.join(SRC, cfg.base), outDir, stem: "base-bare", axis: "h", sizes: BASE_HEIGHTS, recolor: paint });
    log(`  base   bare variant written`);
  }

  const pieces = {};
  for (const p of cfg.pieces) {
    const ent = await emit({ file: path.join(SRC, p.src), outDir, stem: p.id, axis: "w", sizes: PIECE_WIDTHS });
    const slot = name === "boy" ? boySlot(cfg, p, ent) : girlSlot(cfg, base, p, ent);
    pieces[p.id] = {
      id: p.id,
      type: p.type,
      set: p.set,
      name: p.name,
      z: Z[p.type],
      w: ent.w,
      h: ent.h,
      slot,
      variants: ent.variants,
    };
    log(`  ${p.id.padEnd(8)} ${ent.w}×${ent.h}  cx ${slot.cx} cy ${slot.cy} w ${slot.w}  ${p.src.split("/").pop()}`);
  }
  return { base, pieces };
}

/** Brand art lives in the original concept page as base64; read it from there. */
async function originalImages() {
  const html = await fs.readFile(path.join(SRC, "playweary-homepage-v3.html"), "utf8");
  const map = JSON.parse(html.match(/const IMG = (\{.*?\});\s/s)?.[1] ?? "null");
  if (!map) throw new Error("could not find the IMG map in playweary-homepage-v3.html");
  return Object.fromEntries(
    Object.entries(map).map(([k, uri]) => [k, Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64")])
  );
}

async function buildBrand() {
  const outDir = path.join(OUT, "..", "brand");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const originals = await originalImages();
  const entries = {};
  for (const [key, cfg] of Object.entries(brand)) {
    const input = originals[key];
    if (!input) throw new Error(`playweary-homepage-v3.html has no "${key}" image`);
    const meta = await sharp(input).metadata();
    const variants = [];
    for (const w of cfg.widths) {
      const target = Math.min(w, meta.width);
      const buf = await sharp(input)
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 90, alphaQuality: 95, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const name = `${key}-${buf.info.width}.webp`;
      await fs.writeFile(path.join(outDir, name), buf.data);
      variants.push({ src: `brand/${name}`, w: buf.info.width, h: buf.info.height, bytes: buf.data.length });
    }
    entries[key] = { w: meta.width, h: meta.height, variants, ...(cfg.note ? { note: cfg.note } : {}) };
    log(`  brand  ${key} ${meta.width}×${meta.height} → ${variants.map((v) => v.w).join(", ")}`);
  }
  return entries;
}

async function buildShow(built) {
  const outDir = path.join(OUT, "show");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const entries = {};
  for (const [id, cfg] of Object.entries(show)) {
    const [who, piece] = cfg.from;
    const ent = piece === "base" ? built[who].base : piece === "bare" ? built[who].base.bare : built[who].pieces[piece];
    // Re-trim from the full-size export so the 2x file is not an upscale.
    const src = path.join(ROOT, "public", ent.variants.at(-1).src);
    const buf = await sharp(src)
      .resize({ height: cfg.height * 2, withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 92, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const name = `${id}.webp`;
    await fs.writeFile(path.join(outDir, name), buf.data);
    // Logical size = original height × real aspect; the file is 2x that.
    const w = Math.round((buf.info.width / buf.info.height) * cfg.height);
    entries[id] = { src: `art/show/${name}`, w, h: cfg.height, bytes: buf.data.length };
    log(`  show   ${id.padEnd(8)} ${w}×${cfg.height}  (${(buf.data.length / 1024).toFixed(0)} KB)  ← ${who}/${piece}`);
  }
  // every piece of both characters, so any set can be worn
  let pieceBytes = 0;
  for (const [who, c] of Object.entries(built)) {
    for (const ent of Object.values(c.pieces)) {
      const src = path.join(ROOT, "public", ent.variants.at(-1).src);
      const buf = await sharp(src)
        .resize({ width: SHOW_PIECE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 84, alphaQuality: 92, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const name = `${who}-${ent.id}.webp`;
      await fs.writeFile(path.join(outDir, name), buf.data);
      // logical size is half the file: the file is 2x
      entries[`${who}-${ent.id}`] = { src: `art/show/${name}`, w: Math.round(buf.info.width / 2), h: Math.round(buf.info.height / 2), bytes: buf.data.length };
      pieceBytes += buf.data.length;
    }
  }
  log(`  show   ${Object.keys(entries).length - Object.keys(show).length} pieces (${(pieceBytes / 1024).toFixed(0)} KB)`);
  return entries;
}


/** One character in one set, on a transparent print-sized card. */
async function lookCard(built, set, K) {
  const W = Math.round(PRINT.w * K);
  const H = Math.round(PRINT.h * K);
  const decoded = async (ent) => sharp(path.join(ROOT, "public", ent.variants.at(-1).src)).ensureAlpha();
  const charH = ((PRINT.charBottom - PRINT.charTop) / 100) * H;
  const bw = Math.round((charH * built.base.w) / built.base.h);
  const layers = [
    {
      input: await (await decoded(built.base)).resize({ height: Math.round(charH) }).png().toBuffer(),
      left: Math.round((PRINT.cx / 100) * W - bw / 2),
      top: Math.round((PRINT.charTop / 100) * H),
    },
  ];
  for (const p of Object.values(built.pieces).filter((x) => x.set === set).sort((a, b) => a.z - b.z)) {
    const buf = await (await decoded(p)).resize({ width: Math.round((p.slot.w / 100) * W) }).png().toBuffer({ resolveWithObject: true });
    layers.push({
      input: buf.data,
      left: Math.round((p.slot.cx / 100) * W - buf.info.width / 2),
      top: Math.round((p.slot.cy / 100) * H - buf.info.height / 2),
    });
  }
  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers.filter((l) => l.left < W && l.top < H && l.left > -W))
    .png()
    .toBuffer();
}

/** Share image, favicon-adjacent icons: the brand and both kids, from the same art. */
async function buildSocial(built) {
  const appDir = path.join(ROOT, "src", "app");
  const W = 1200;
  const H = 630;
  const K = 1.1;
  const crop = async (buf) => {
    // the card has empty margin above and below the figure
    const m = await sharp(buf).metadata();
    return sharp(buf).extract({ left: 0, top: Math.round(m.height * 0.15), width: m.width, height: Math.round(m.height * 0.72) }).png().toBuffer();
  };
  const boy = await crop(await lookCard(built.boy, 2, K));
  const girl = await crop(await lookCard(built.girl, 1, K));
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#FFE8D6"/><stop offset="1" stop-color="#FFC9A9"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><path d="M-40 520C160 440 300 600 520 500S900 430 1240 520V700H-40Z" fill="#FCC006"/></svg>`
  );
  const logo = await sharp(path.join(ROOT, "public", manifestBrand.logo_light.variants.at(-1).src)).resize({ width: 470 }).png().toBuffer();
  const bh = (await sharp(boy).metadata()).height;
  const png = await sharp(bg)
    .composite([
      { input: logo, left: 40, top: 120 },
      { input: boy, left: 440, top: H - bh - 10 },
      { input: girl, left: 690, top: H - bh - 10 },
    ])
    .png()
    .toBuffer();
  await fs.writeFile(path.join(appDir, "opengraph-image.png"), png);
  await fs.writeFile(path.join(appDir, "twitter-image.png"), png);
  await fs.writeFile(path.join(appDir, "opengraph-image.alt.txt"), "Playweary: one printed shirt, nine velcro pieces, 27 looks. A boy and a girl in their sets.\n");
  await fs.writeFile(path.join(appDir, "twitter-image.alt.txt"), "Playweary: one printed shirt, nine velcro pieces, 27 looks. A boy and a girl in their sets.\n");

  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="30" fill="#9F3EFF"/><path d="M38 92V30h26a20 20 0 0 1 0 40H38" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="86" cy="86" r="12" fill="#FCC006"/></svg>\n`;
  await fs.writeFile(path.join(appDir, "icon.svg"), icon);
  await sharp(Buffer.from(icon), { density: 300 }).resize(180, 180).png().toFile(path.join(appDir, "apple-icon.png"));
  log("  social opengraph-image, twitter-image, icon.svg, apple-icon");
}

async function buildDecor() {
  const outDir = path.join(OUT, "decor");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const entries = {};
  for (const [file, name] of Object.entries(decor)) {
    const svg = await fs.readFile(path.join(SRC, "Play Weary Website Elements", "SVG", file), "utf8");
    const vb = svg.match(/viewBox="([\d.\s-]+)"/)?.[1].trim().split(/\s+/).map(Number);
    if (!vb) throw new Error(`${file} has no viewBox`);
    await fs.writeFile(path.join(outDir, `${name}.svg`), svg);
    entries[name] = { src: `art/decor/${name}.svg`, w: round(vb[2]), h: round(vb[3]), usesText: /<text[\s>]/.test(svg) };
    log(`  decor  ${name.padEnd(20)} ${round(vb[2])}×${round(vb[3])}${entries[name].usesText ? "  (live <text>: needs its font)" : ""}`);
  }
  return entries;
}

/** Stack a look on a navy tee-sized card so placement can be judged by eye. */
async function preview(name, cfg, built) {
  await fs.mkdir(PREVIEW, { recursive: true });
  const K = 2; // preview px per print px
  const W = PRINT.w * K;
  const H = PRINT.h * K;
  const decoded = async (ent) => sharp(path.join(ROOT, "public", ent.variants.at(-1).src)).ensureAlpha();
  const cards = [];
  for (const set of [1, 2, 3]) {
    const layers = [];
    const charH = ((PRINT.charBottom - PRINT.charTop) / 100) * PRINT.h * K;
    const bw = Math.round((charH * built.base.w) / built.base.h);
    layers.push({
      input: await (await decoded(built.base)).resize({ height: Math.round(charH) }).png().toBuffer(),
      left: Math.round((PRINT.cx / 100) * W - bw / 2),
      top: Math.round((PRINT.charTop / 100) * H),
    });
    const mine = Object.values(built.pieces).filter((p) => p.set === set).sort((a, b) => a.z - b.z);
    for (const p of mine) {
      const pw = Math.round((p.slot.w / 100) * W);
      const buf = await (await decoded(p)).resize({ width: pw }).png().toBuffer({ resolveWithObject: true });
      layers.push({
        input: buf.data,
        left: Math.round((p.slot.cx / 100) * W - buf.info.width / 2),
        top: Math.round((p.slot.cy / 100) * H - buf.info.height / 2),
      });
    }
    const card = await sharp({ create: { width: W, height: H, channels: 4, background: "#0B2243" } })
      .composite(layers.filter((l) => l.left < W && l.top < H))
      .png()
      .toBuffer();
    cards.push(card);
  }
  const sheet = await sharp({ create: { width: W * 3, height: H, channels: 4, background: "#ffffff" } })
    .composite(cards.map((input, i) => ({ input, left: i * W, top: 0 })))
    .png()
    .toFile(path.join(PREVIEW, `${name}-looks.png`));
  log(`  preview ${path.relative(ROOT, path.join(PREVIEW, `${name}-looks.png`))} (${sheet.width}×${sheet.height})`);
}

async function main() {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const manifest = { generatedBy: "scripts/build-assets.mjs", print: PRINT, characters: {}, brand: {}, show: {}, decor: {} };
  for (const [name, cfg] of Object.entries(characters)) {
    const built = await buildCharacter(name, cfg);
    manifest.characters[name] = built;
    await preview(name, cfg, built);
  }
  log("\nbrand");
  manifest.brand = await buildBrand();
  manifestBrand = manifest.brand;
  log("\nsocial");
  await buildSocial(manifest.characters);
  log("\nshow");
  manifest.show = await buildShow(manifest.characters);
  log("\ndecor");
  manifest.decor = await buildDecor();

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const total = Object.values(manifest.characters)
    .flatMap((c) => [c.base, ...Object.values(c.pieces)])
    .flatMap((e) => e.variants)
    .reduce((a, v) => a + v.bytes, 0);
  log(`\nwrote ${path.relative(ROOT, MANIFEST)}; character art ${(total / 1024).toFixed(0)} KB across all sizes`);
}

main().catch((err) => {
  console.error("\nassets failed:", err.message);
  process.exit(1);
});
