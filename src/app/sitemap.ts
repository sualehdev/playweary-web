import type { MetadataRoute } from "next";
import { PRODUCT_PAGES } from "@/content/productPages";
import { POLICIES } from "@/content/policies";
import { SITE_URL } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/thank-you`, changeFrequency: "yearly" as const, priority: 0.1 },
    ...PRODUCT_PAGES.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...POLICIES.map((p) => ({ url: `${SITE_URL}/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
