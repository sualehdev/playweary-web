import { describe, expect, it } from "vitest";
import { pieceArt } from "@/content/art";
import { ALL_SETS, CHARACTERS, comboFor, lookNumber, lookForHour, totalLooks } from "@/content/characters";
import { PRODUCTS, SIZES, money, productsFor } from "@/content/products";
import { INFO } from "@/content/info";
import { validate, isZip, isUsPhone } from "@/lib/checkout";
import { frameUrls, FRAME_COUNT } from "@/content/swap";
import { isEmail } from "@/lib/newsletter";

describe("looks", () => {
  it("counts 3^slots looks", () => {
    expect(totalLooks(CHARACTERS.boy)).toBe(27);
    expect(totalLooks(CHARACTERS.girl)).toBe(81);
  });

  it("numbers a full outfit as a base-3 position, first slot most significant", () => {
    const boy = CHARACTERS.boy;
    expect(lookNumber(boy, { hair: "hair1", outfit: "outfit1", shoes: "shoes1" })).toBe(1);
    expect(lookNumber(boy, { hair: "hair3", outfit: "outfit3", shoes: "shoes3" })).toBe(27);
    expect(lookNumber(boy, { hair: "hair2", outfit: "outfit1", shoes: "shoes1" })).toBe(10);
    expect(lookNumber(CHARACTERS.girl, { hair: "hair3", outfit: "outfit3", bag: "bag3", shoes: "shoes3" })).toBe(81);
  });

  it("has no number until every slot is filled", () => {
    expect(lookNumber(CHARACTERS.boy, { hair: "hair1", outfit: "outfit1" })).toBeNull();
  });

  it("prefers the fullest combo that matches", () => {
    const boy = CHARACTERS.boy;
    expect(comboFor(boy, { hair: "hair2", outfit: "outfit2", shoes: "shoes2" })?.label).toBe("FULL MATCH KIT!");
    expect(comboFor(boy, { outfit: "outfit2", shoes: "shoes2" })?.label).toBe("MATCH DAY");
    expect(comboFor(boy, { hair: "hair1", outfit: "outfit2" })).toBeUndefined();
  });

  it("dresses for the hour", () => {
    expect(lookForHour(3).picks).toBeNull();
    expect(lookForHour(10).picks).toEqual([2, 2, 2]);
    expect(lookForHour(17).picks).toEqual([1, 1, 1]);
    expect(lookForHour(22).picks).toEqual([3, 3, 3]);
  });
});

describe("catalogue", () => {
  it("has unique product ids", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sells exactly two kits, one per character, at $40", () => {
    expect(PRODUCTS.map((p) => p.id)).toEqual(["kit-boy", "kit-girl"]);
    expect(PRODUCTS.every((p) => p.price === 40)).toBe(true);
    expect(productsFor("boy").map((p) => p.id)).toEqual(["kit-boy"]);
    expect(SIZES.length).toBeGreaterThan(3);
  });

  it("every set's pieces exist in the art manifest, with images", () => {
    for (const set of ALL_SETS)
      for (const id of set.pieces) {
        const art = pieceArt(set.character, id);
        expect(art.variants.length).toBeGreaterThan(0);
        expect(art.slot.w).toBeGreaterThan(0);
      }
  });

  it("formats money in US dollars", () => {
    expect(money(40)).toBe("$40");
    expect(money(1240)).toBe("$1,240");
    expect(money(12.5)).toBe("$12.50");
  });

  it("has no placeholder text or long dashes in the info pages", () => {
    for (const e of INFO)
      for (const p of [e.title, ...e.body]) {
        expect(p).not.toMatch(/placeholder|[—–]/i);
      }
  });
});

describe("misc", () => {
  it("picks the smaller frame set for phones", () => {
    expect(frameUrls(900)).toHaveLength(FRAME_COUNT);
    expect(frameUrls(900)[0]).toBe("/frames/swap-0001-960.webp");
    expect(frameUrls(1400)[71]).toBe("/frames/swap-0072-1280.webp");
  });

  it("validates emails loosely", () => {
    expect(isEmail("grownup@example.com")).toBe(true);
    expect(isEmail(" a@b.co ")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
  });
});

describe("checkout", () => {
  const ok = { email: "sam@example.com", phone: "(212) 555-0147", firstName: "Sam", lastName: "Lee", line1: "1 Main St", line2: "", city: "Austin", state: "TX", zip: "78701" };

  it("accepts a complete US address", () => {
    expect(validate(ok, isEmail)).toEqual({});
  });

  it("flags every missing or malformed field", () => {
    const e = validate({ ...ok, email: "x", phone: "123", firstName: " ", state: "ZZ", zip: "7870" }, isEmail);
    expect(Object.keys(e).sort()).toEqual(["email", "firstName", "phone", "state", "zip"]);
  });

  it("checks ZIP and phone formats", () => {
    expect(isZip("78701")).toBe(true);
    expect(isZip("78701-1234")).toBe(true);
    expect(isZip("7870")).toBe(false);
    expect(isUsPhone("+1 212 555 0147")).toBe(true);
    expect(isUsPhone("555-0147")).toBe(false);
  });
});
