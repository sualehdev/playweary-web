import { describe, expect, it } from "vitest";
import { orderNumber } from "@/lib/checkout";
import { DEMO_REFS, LAST_STAGE, STAGES, demoOrders, normalizeRef, skewFor, stageAt, timeline, type TrackedOrder } from "@/lib/orders";

const base = demoOrders()[0];
const fresh = (placed: Date): TrackedOrder => ({ ...base, frozen: undefined, demo: false, placedAt: placed.toISOString() });

describe("normalizeRef", () => {
  it("accepts any spelling of a reference", () => {
    for (const v of ["PW-100001", "pw 100001", " 100001 ", "pw100001"]) expect(normalizeRef(v)).toBe("PW-100001");
  });
  it("rejects nonsense", () => {
    for (const v of ["", "PW-12", "ABC-123456", "PW-1234567"]) expect(normalizeRef(v)).toBeNull();
  });
});

describe("stageAt", () => {
  const t0 = new Date("2026-01-01T10:00:00Z");
  const at = (min: number) => new Date(t0.getTime() + min * 60_000);
  it("walks the stages as time passes", () => {
    const o = fresh(t0);
    expect(stageAt(o, at(0))).toBe(0);
    expect(stageAt(o, at(STAGES[2].at))).toBe(2);
    expect(stageAt(o, at(10_000))).toBe(LAST_STAGE);
  });
  it("skewFor lands exactly on a stage", () => {
    const o = fresh(t0);
    const now = at(1);
    expect(stageAt({ ...o, skew: skewFor(o, 3, now) }, now)).toBe(3);
  });
  it("holds a demo order on its stage", () => {
    expect(demoOrders().map((o) => stageAt(o))).toEqual([1, 2, 4, 3]);
  });
});

describe("demo orders and numbers", () => {
  it("has the advertised refs", () => {
    expect(demoOrders().map((o) => o.number)).toEqual([...DEMO_REFS]);
  });
  it("never reuses a taken or demo reference", () => {
    const seq = [0, 0, 0.5];
    let i = 0;
    const n = orderNumber(["PW-100000"], () => seq[i++]);
    expect(n).toBe("PW-550000".replace("550000", String(Math.floor(100000 + 0.5 * 900000))));
  });
  it("timeline marks progress", () => {
    const t = timeline(base, 2);
    expect(t.map((e) => e.done)).toEqual([true, true, true, false, false]);
    expect(t[2].current).toBe(true);
  });
});
