import { describe, expect, it } from "vitest";
import { buildShowData } from "@/content/showData";
import { showAssets } from "@/content/art";

const settled = (data: ReturnType<typeof buildShowData>, name: string) => {
  const layer = data.layers.find((l) => l.nm === name)!;
  const p = (layer.ks.p.k as { s: number[] }[])[1].s;
  const sc = (layer.ks.s.k as { s: number[] }[])[1].s[0];
  const asset = data.assets.find((a) => a.id === layer.refId)!;
  return { x: p[0], y: p[1], w: (asset.w * sc) / 100, h: (asset.h * sc) / 100, ref: layer.refId };
};

describe("the show, re-dressed", () => {
  it("dresses him and her in the sets asked for, with a bag for her", () => {
    const d = buildShowData({ boy: 3, girl: 2 });
    expect(d.layers.map((l) => l.nm)).toEqual([
      "boy-hair", "boy-shoes", "boy-outfit", "boy-base",
      "girl-hair", "girl-bag", "girl-shoes", "girl-outfit", "girl-base-bare", "girl-base",
    ]);
    expect(d.layers.map((l) => l.refId)).toEqual([
      "boy-hair3", "boy-shoes3", "boy-outfit3", "boy",
      "girl-hair2", "girl-bag2", "girl-shoes2", "girl-outfit2", "girlBare", "girl",
    ]);
    // every layer points at an asset that exists, and every asset has art
    for (const l of d.layers) expect(d.assets.some((a) => a.id === l.refId)).toBe(true);
    for (const a of d.assets) expect(showAssets[a.id]).toBeDefined();
  });

  it("settles every piece on its own character, hair above outfit above shoes", () => {
    for (const look of [{ boy: 1, girl: 1 }, { boy: 2, girl: 3 }, { boy: 3, girl: 2 }] as const) {
      const d = buildShowData(look);
      for (const who of ["boy", "girl"] as const) {
        const base = settled(d, `${who}-base`);
        const hair = settled(d, `${who}-hair`);
        const outfit = settled(d, `${who}-outfit`);
        const shoes = settled(d, `${who}-shoes`);
        for (const piece of [hair, outfit, shoes]) {
          expect(Math.abs(piece.x - base.x)).toBeLessThan(base.w); // over the body, not beside it
          expect(piece.y).toBeGreaterThan(base.y - base.h / 2 - 80);
          expect(piece.y).toBeLessThan(base.y + base.h / 2 + 40);
        }
        expect(hair.y).toBeLessThan(outfit.y);
        expect(outfit.y).toBeLessThan(shoes.y);
        // and the hair sits at the head: the top fifth of the figure
        expect(hair.y).toBeLessThan(base.y - base.h * 0.2);
      }
    }
  });

  it("does not disturb the template: the flight keeps its shape", () => {
    const a = buildShowData({ boy: 1, girl: 1 });
    const hair = a.layers.find((l) => l.nm === "boy-hair")!;
    const ks = hair.ks.p.k as { t: number; s: number[] }[];
    // fly in from 330 above; the hop lifts the body 58, and the head a little
    // more because she grows in the hop
    expect(ks[1].s[1] - ks[0].s[1]).toBeCloseTo(330, 0);
    expect(ks[1].s[1] - ks[3].s[1]).toBeGreaterThan(58);
    expect(ks[1].s[1] - ks[3].s[1]).toBeLessThan(66);
  });

  it("keeps every piece on the body through the hop and the sleep", () => {
    for (const look of [{ boy: 1, girl: 1 }, { boy: 2, girl: 3 }, { boy: 3, girl: 2 }] as const) {
      const d = buildShowData(look);
      for (const who of ["boy", "girl"] as const) {
        const layer = (nm: string) => d.layers.find((l) => l.nm === nm)!;
        const base = layer(`${who}-base`);
        const bp = base.ks.p.k as { s: number[] }[];
        const bs = base.ks.s.k as { s: number[] }[];
        for (const slot of ["hair", "outfit", "shoes"]) {
          const pp = layer(`${who}-${slot}`).ks.p.k as { s: number[] }[];
          const rest = [pp[1].s[0] - bp[1].s[0], pp[1].s[1] - bp[1].s[1]];
          for (let k = 1; k < pp.length; k++) {
            const f = bs[k].s[0] / bs[1].s[0];
            expect(Math.abs(pp[k].s[0] - (bp[k].s[0] + rest[0] * f))).toBeLessThan(0.5);
            expect(Math.abs(pp[k].s[1] - (bp[k].s[1] + rest[1] * f))).toBeLessThan(0.5);
          }
        }
      }
    }
  });

  it("is a fresh copy each time", () => {
    const a = buildShowData({ boy: 1, girl: 1 });
    const b = buildShowData({ boy: 1, girl: 1 });
    expect(settled(a, "boy-hair")).toEqual(settled(b, "boy-hair"));
  });
});
