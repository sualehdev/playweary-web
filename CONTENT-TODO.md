# Placeholder content to replace

Everything below is stand-in copy or art that works today but is not real.
Edit the file named in each row; nothing else needs to change.

| What | Where | Notes |
|---|---|---|
| Prices, "was" prices, bundle prices | `src/content/products.ts`, `src/content/characters.ts` (`SET_PRICE`) | Sibling Bundle now covers both kids; its price was written for the old contents |
| Girl piece and set names (Garden Hat, Meadow Set, …) | `scripts/asset-config.mjs`, `src/content/characters.ts` | Then run `npm run assets` |
| Reviews (three samples, labelled "sample") | `src/components/sections.tsx` → `Reviews` | Replace with real, verbatim quotes |
| Parents section figures (35 × 45, 40×, …) | `src/components/sections.tsx` → `Parents` | |
| Sizing, delivery & returns, fabric & care, safety, contact | `src/content/info.ts` | Safety needs compliance sign-off before launch |
| Free-delivery / 30-day-returns / OEKO-TEX / 40-wash claims | `Promo`, `Hero`, `CartDrawer`, `Parents` | Make sure each is true |
| Site URL | `NEXT_PUBLIC_SITE_URL` or `src/content/site.ts` | Used for canonical, sitemap, share cards |
| Contact email | `src/content/info.ts` | |
| Girl shirt print; hi-res boy print | `brand.tee_print` in `scripts/asset-config.mjs` | Shop's tee photo is the boy's 520 px print |
| Vector logo | `public/brand/*.webp` | Currently 760 px raster |
| "The swap" frames | `public/frames/swap-NNNN-{960,1280}.webp`, count in `src/content/swap.ts` | Currently baked from placeholder art (`npm run frames`) |
| Mascot (Pip) | `src/components/Jigsaw.tsx` | Drawn in code; swap in the illustrator's fox |
| Checkout | `src/lib/checkout.ts` | Says checkout is not open yet |
| Newsletter | `src/lib/newsletter.ts` | Validates; sends nowhere yet |
| Privacy and terms pages | not written | Needed before collecting emails |
| Rip / Stick / Play tag SVGs, cart badge | `public/art/decor/` | Use live text in Raleway; not used on the page yet |
