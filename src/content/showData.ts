/**
 * The Lottie for "the show", re-dressed on demand.
 *
 * show.lottie.json keeps its choreography (when each piece flies in, hops and
 * falls asleep), but its artwork and the spot each piece settles on were made
 * for placeholder cut-outs. `buildShowData` swaps in the real art for a given
 * look and re-fits every piece to its character the same way the bench does:
 * from the piece's slot in the print, scaled to wherever the base character
 * ends up on screen. Each piece's whole flight is shifted by the same amount,
 * so the movement is untouched and only where it ends up changes.
 */

import template from "./show.lottie.json";
import { PRINT, pieceArt, showAssets, type CharacterId } from "./art";
import { CHARACTERS } from "./characters";
import type { Look } from "./swapPieces";

type Vec = number[];
type Keyframe = { t: number; s?: Vec; e?: Vec; [k: string]: unknown };
type Track = { a?: number; k: Keyframe[] | Vec };
type Layer = {
  ind: number;
  nm: string;
  refId: string;
  ks: { p: Track; s: Track; a: { k: Vec }; o: Track };
  [k: string]: unknown;
};
type Asset = { id: string; w: number; h: number; u: string; p: string; e: number };
export type ShowData = { assets: Asset[]; layers: Layer[]; ip: number; op: number; [k: string]: unknown };

const frames = (t: Track) => t.k as Keyframe[];

/** Every keyframe's vectors (start and, if present, end). */
function eachVec(t: Track, fn: (v: Vec) => void) {
  for (const kf of frames(t)) {
    if (kf.s) fn(kf.s);
    if (kf.e) fn(kf.e);
  }
}

/** Layer name for a slot, e.g. boy + hair -> "boy-hair". */
const layerName = (who: CharacterId, slot: string) => `${who}-${slot}`;

/** How far (in frames) the bag trails the dress it is carried with. */
const BAG_LAG = 6;

export function buildShowData(look: Look): ShowData {
  const data = structuredClone(template) as unknown as ShowData;
  const byName = new Map(data.layers.map((l) => [l.nm, l]));

  // A bag layer for her: a copy of her dress's motion, a few frames behind.
  const dress = byName.get("girl-outfit")!;
  const bag = structuredClone(dress);
  bag.nm = "girl-bag";
  bag.ind = Math.max(...data.layers.map((l) => l.ind)) + 1;
  for (const track of [bag.ks.p, bag.ks.s, bag.ks.o]) for (const kf of frames(track)) kf.t += BAG_LAG;
  byName.set(bag.nm, bag);

  // Her base wears a white dress that peeks out beside a halter gown. Once her
  // outfit has arrived, a copy of her with that dress painted out fades in over her.
  const girlBase = byName.get("girl-base")!;
  const bare = structuredClone(girlBase);
  bare.nm = "girl-base-bare";
  bare.ind = bag.ind + 1;
  bare.ks.o = {
    a: 1,
    k: [
      { t: 0, s: [0], i: { x: [0.18], y: [1] }, o: { x: [0.42], y: [0] } },
      { t: 52, s: [0], i: { x: [0.18], y: [1] }, o: { x: [0.42], y: [0] } },
      { t: 62, s: [100] },
    ],
  };
  byName.set(bare.nm, bare);

  const assets: Asset[] = [];
  const addAsset = (id: string) => {
    const art = showAssets[id];
    if (!art) throw new Error(`No show art "${id}" in the manifest. Run npm run assets.`);
    assets.push({ id, w: art.w, h: art.h, u: "", p: "/" + art.src, e: 0 });
    return art;
  };

  for (const who of ["boy", "girl"] as const) {
    const base = byName.get(layerName(who, "base"))!;
    const baseArt = addAsset(who);
    base.refId = who;
    base.ks.a.k = [baseArt.w / 2, baseArt.h / 2, 0];
    if (who === "girl") {
      const b = byName.get("girl-base-bare")!;
      const bareArt = addAsset("girlBare");
      b.refId = "girlBare";
      b.ks.a.k = [bareArt.w / 2, bareArt.h / 2, 0];
    }

    // Where the base character settles, and how big it is there.
    const pos = frames(base.ks.p)[1].s!;
    const scale = frames(base.ks.s)[1].s![0] / 100;
    const charH = baseArt.h * scale;
    // comp px per print px, then the whole print box in comp px
    const g = charH / (((PRINT.charBottom - PRINT.charTop) / 100) * PRINT.h);
    const printW = PRINT.w * g;
    const printH = PRINT.h * g;
    const printTop = pos[1] - charH / 2 - (PRINT.charTop / 100) * printH;
    const printLeft = pos[0] - (PRINT.cx / 100) * printW;

    for (const slot of CHARACTERS[who].slots) {
      const id = `${slot}${look[who]}`;
      const layer = byName.get(layerName(who, slot))!;
      const art = addAsset(`${who}-${id}`);
      const s = pieceArt(who, id).slot;

      const x = printLeft + (s.cx / 100) * printW;
      const y = printTop + (s.cy / 100) * printH;
      const want = (((s.w / 100) * printW) / art.w) * 100; // layer scale, in %

      const oldPos = frames(layer.ks.p)[1].s!;
      const oldScale = frames(layer.ks.s)[1].s![0];
      const dx = x - oldPos[0];
      const dy = y - oldPos[1];
      const r = want / oldScale;
      // The fly-in keeps its own path. From the landing on, the base hops and
      // shrinks into sleep, so each piece rides with it: its offset from her
      // centre grows and shrinks with her scale, or the hat drifts off the head.
      const pk = frames(layer.ks.p);
      const bp = frames(base.ks.p);
      const bs = frames(base.ks.s);
      const at = (k: number) => {
        const f = bs[k].s![0] / 100 / scale;
        return [bp[k].s![0] + (x - pos[0]) * f, bp[k].s![1] + (y - pos[1]) * f];
      };
      pk.forEach((kf, k) => {
        const v = k === 0 ? [kf.s![0] + dx, kf.s![1] + dy] : at(k);
        kf.s![0] = v[0];
        kf.s![1] = v[1];
        if (kf.e) {
          const next = k + 1 < pk.length ? at(k + 1) : v;
          kf.e[0] = next[0];
          kf.e[1] = next[1];
        }
      });
      eachVec(layer.ks.s, (v) => {
        v[0] *= r;
        v[1] *= r;
      });
      layer.refId = `${who}-${id}`;
      layer.ks.a.k = [art.w / 2, art.h / 2, 0];
    }
  }

  // front to back: his pieces, her pieces (hair, bag, shoes, outfit), her base
  const order = [
    "boy-hair", "boy-shoes", "boy-outfit", "boy-base",
    "girl-hair", "girl-bag", "girl-shoes", "girl-outfit", "girl-base-bare", "girl-base",
  ];
  data.layers = order.map((n) => byName.get(n)!);
  data.assets = assets;
  return data;
}
