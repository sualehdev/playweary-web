import { describe, expect, it } from "vitest";
import { pieceArt } from "@/content/art";
import { RACK_ROWS, piecesFor, placePieces, rackSlot, rollLook } from "@/content/swapPieces";

describe("the swap pieces", () => {
  it("rolls one boy set and one girl set, each 1 to 3", () => {
    for (let n = 0; n < 50; n++) {
      const l = rollLook();
      expect([1, 2, 3]).toContain(l.boy);
      expect([1, 2, 3]).toContain(l.girl);
    }
    expect(rollLook(() => 0)).toEqual({ boy: 1, girl: 1 });
    expect(rollLook(() => 0.999)).toEqual({ boy: 3, girl: 3 });
  });

  it("brings the boy's three pieces and the girl's four, all of one set each, and all real", () => {
    const list = piecesFor({ boy: 2, girl: 3 });
    expect(list.map((p) => p.character + ":" + p.id)).toEqual([
      "boy:hair2", "boy:outfit2", "boy:shoes2",
      "girl:hair3", "girl:outfit3", "girl:bag3", "girl:shoes3",
    ]);
    for (const p of list) expect(pieceArt(p.character, p.id).variants.length).toBeGreaterThan(0);
  });

  it("has nothing out before the first hit, a teaser per character after it, and all of them after the second", () => {
    expect(placePieces(0.2, RACK_ROWS)).toHaveLength(0);
    expect(placePieces(0.35, RACK_ROWS).map((p) => p.i)).toEqual([0, 3]);
    expect(placePieces(0.7, RACK_ROWS)).toHaveLength(7);
  });

  it("ends with every piece in its rack slot, upright, boy row above girl row", () => {
    const end = placePieces(1, RACK_ROWS);
    expect(end).toHaveLength(7);
    for (const p of end) {
      const slot = rackSlot(p.i, RACK_ROWS);
      expect(p.x).toBeCloseTo(slot.x, 1);
      expect(p.y).toBeCloseTo(slot.y, 1);
      expect(p.rotate).toBeCloseTo(0, 1);
    }
    expect(rackSlot(0, RACK_ROWS).y).toBeLessThan(rackSlot(3, RACK_ROWS).y);
  });

  it("keeps the flight clear of Pip, who stands on the left", () => {
    for (let t = 0.3; t < 0.8; t += 0.02) for (const p of placePieces(t, RACK_ROWS)) expect(p.x).toBeGreaterThan(700);
  });
});
