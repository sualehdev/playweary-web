import { describe, expect, it } from "vitest";
import { FOOTER_ORDER, POLICIES, POLICY_BY_SLUG, visibleSections, type PolicyPage } from "@/content/policies";
import { SHIPPING } from "@/lib/checkout";

const text = (p: PolicyPage) =>
  [p.title, p.description, ...p.sections.flatMap((s) => [s.h ?? "", ...(s.p ?? []), ...(s.ul ?? [])])].join("\n");

describe("policy pages", () => {
  it("has every footer page, with no long dashes, fake phone or demo wording", () => {
    expect(FOOTER_ORDER.every((slug) => POLICY_BY_SLUG[slug])).toBe(true);
    expect(FOOTER_ORDER.length).toBe(POLICIES.length);
    for (const p of POLICIES) expect(text(p)).not.toMatch(/[—–]|555|demo/i);
  });

  it("quotes the same shipping numbers as the checkout", () => {
    const t = text(POLICY_BY_SLUG["shipping-policy"]);
    for (const s of SHIPPING) {
      expect(t).toContain(`${s.days[0]} to ${s.days[1]} business days`);
      if (s.price) expect(t).toContain(`$${s.price}`);
    }
  });

  it("never shows a [TODO] placeholder to shoppers", () => {
    for (const p of POLICIES) {
      const shown = [p.title, p.description, ...(p.summary ?? []), ...visibleSections(p).flatMap((s) => [s.h ?? "", ...(s.p ?? []), ...(s.ul ?? [])])].join("\n");
      expect(shown).not.toContain("[TODO");
    }
  });

  it("links only to pages that exist", () => {
    for (const p of POLICIES) for (const r of p.related ?? []) expect(POLICY_BY_SLUG[r]).toBeTruthy();
  });
});
