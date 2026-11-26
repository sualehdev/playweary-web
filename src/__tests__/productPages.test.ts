import { describe, expect, it } from "vitest";
import { PRODUCT_PAGES, describe as describeKit, kitPieces, productPath } from "@/content/productPages";
import { PRODUCTS } from "@/content/products";

describe("product pages", () => {
  it("has one page per kit, at the URL the audit asks for", () => {
    expect(PRODUCT_PAGES.map((p) => p.slug)).toEqual(["boy-shirt-kit", "girl-shirt-kit"]);
    expect(productPath("girl")).toBe("/products/girl-shirt-kit");
    for (const p of PRODUCT_PAGES) expect(PRODUCTS.some((k) => k.id === `kit-${p.character}`)).toBe(true);
  });

  it("names every piece in the box", () => {
    expect(kitPieces("boy")).toHaveLength(9);
    expect(kitPieces("girl")).toHaveLength(12);
    expect(describeKit("boy")).not.toMatch(/[—–]/);
  });
});
