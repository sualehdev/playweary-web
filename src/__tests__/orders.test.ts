import { describe, expect, it } from "vitest";
import { fromResponse } from "@/lib/checkout";
import { LAST_STAGE, normalizeCode, normalizeRef, stageIndex, timeline, type TrackedOrder } from "@/lib/orders";

const order = (over: Partial<TrackedOrder> = {}): TrackedOrder => ({
  number: "PW-100100",
  trackingCode: "PWT-ABCDEFGHJKMN",
  status: "PENDING",
  stage: "placed",
  placedAt: "2026-01-01T10:00:00Z",
  email: "a***a@example.com",
  shipTo: { firstName: "Ada", city: "Austin", state: "TX" },
  shipping: "standard",
  payment: "cod",
  paymentStatus: "UNPAID",
  lines: [],
  subtotal: 40,
  shippingCost: 0,
  total: 40,
  arrives: ["2026-01-08T10:00:00Z", "2026-01-12T10:00:00Z"],
  isBackorder: false,
  carrier: null,
  carrierTrackingNumber: null,
  timeline: [{ status: "PENDING", stage: "placed", message: "Order placed.", at: "2026-01-01T10:00:00Z" }],
  ...over,
});

describe("normalizeRef / normalizeCode", () => {
  it("accepts any spelling of an order number", () => {
    for (const v of ["PW-100100", "pw 100100", " 100100 ", "pw100100"]) expect(normalizeRef(v)).toBe("PW-100100");
  });
  it("rejects nonsense numbers", () => {
    for (const v of ["", "PW-12", "ABC-123456", "PW-1234567"]) expect(normalizeRef(v)).toBeNull();
  });
  it("accepts tracking codes in any case, rejects malformed ones", () => {
    expect(normalizeCode(" pwt-abcdefghjkmn ")).toBe("PWT-ABCDEFGHJKMN");
    for (const v of ["", "PWT-SHORT", "PWT-ABCDEFGHIJKL" /* I and L aren't Crockford */]) expect(normalizeCode(v)).toBeNull();
  });
});

describe("timeline", () => {
  it("maps the server's stage onto the five stops", () => {
    expect(stageIndex(order())).toBe(0);
    expect(stageIndex(order({ stage: "shipped" }))).toBe(2);
    expect(stageIndex(order({ stage: "delivered" }))).toBe(LAST_STAGE);
    expect(stageIndex(order({ stage: "cancelled" }))).toBe(0);
  });

  it("says 'placed' until confirmed, then 'confirmed'", () => {
    expect(timeline(order())[0].label).toBe("Order placed");
    const confirmed = order({
      status: "CONFIRMED",
      timeline: [...order().timeline, { status: "CONFIRMED", stage: "placed", message: null, at: "2026-01-01T12:00:00Z" }],
    });
    expect(timeline(confirmed)[0].label).toBe("Order confirmed");
  });

  it("uses real event times and the courier number", () => {
    const shipped = order({
      status: "SHIPPED",
      stage: "shipped",
      carrier: "USPS",
      carrierTrackingNumber: "9400 1000",
      timeline: [
        ...order().timeline,
        { status: "PACKED", stage: "packed", message: null, at: "2026-01-02T09:00:00Z" },
        { status: "SHIPPED", stage: "shipped", message: null, at: "2026-01-03T09:00:00Z" },
      ],
    });
    const t = timeline(shipped);
    expect(t.map((e) => e.done)).toEqual([true, true, true, false, false]);
    expect(t[2].current).toBe(true);
    expect(t[2].time?.toISOString()).toBe("2026-01-03T09:00:00.000Z");
    expect(t[2].note).toContain("9400 1000");
    expect(t[3].time).toBeNull();
  });
});

describe("placed order from the API", () => {
  it("converts cents to dollars", () => {
    const placed = fromResponse({
      number: "PW-100100",
      trackingCode: "PWT-ABCDEFGHJKMN",
      status: "PENDING",
      placedAt: "2026-01-01T10:00:00Z",
      email: "a@example.com",
      phone: "+15551234567",
      address: { firstName: "Ada", lastName: "L", line1: "1 Main", line2: "", city: "Austin", state: "TX", zip: "73301" },
      shipping: "standard",
      payment: "cod",
      lines: [{ id: "kit-boy", size: "5", q: 2, name: "Boy Shirt Kit", unitPriceCents: 4000, lineTotalCents: 8000 }],
      subtotalCents: 8000,
      shippingCents: 1200,
      totalCents: 9200,
      arrives: ["2026-01-05T10:00:00Z", "2026-01-06T10:00:00Z"],
      isBackorder: false,
    });
    expect(placed).toMatchObject({ subtotal: 80, shippingCost: 12, total: 92 });
    expect(placed.lines[0]).toMatchObject({ unitPrice: 40, lineTotal: 80, q: 2 });
  });
});
