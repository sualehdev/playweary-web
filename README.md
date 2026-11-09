# Playweary

One printed shirt, nine velcro pieces (twelve for her), 27 looks (81 for her). Next.js 16, React 19, GSAP.

```bash
npm run dev       # http://localhost:3000
npm run check     # lint + typecheck + tests + production build
npm run assets    # rebuild public/art, public/brand and the share images from the designer's folders
npm run frames    # rebake the placeholder "swap" frames into public/frames
```

`npm run assets` reads the designer's source folders (`Characters Elements`,
`Play Weary Website Elements`, `playweary-homepage-v3.html`). They live outside
this repo; set `PW_SOURCE_DIR` if they are not in its parent folder. The mapping
of source file to piece is `scripts/asset-config.mjs`.

## Where things live

| | |
|---|---|
| `src/content/` | Everything editable: characters and sets, products and prices, info pages, site URL, swap frames, and the generated art manifest |
| `src/store/` | The basket: a pure reducer (`shop.ts`, tested) and its provider |
| `src/components/` | One file per section |
| `src/lib/` | `motion.ts` (GSAP, registered once), `effects.ts`, and the `checkout` / `newsletter` seams |
| `public/art`, `public/brand`, `public/frames` | Generated; do not edit by hand |

## Before launch

All placeholder content is listed in [CONTENT-TODO.md](CONTENT-TODO.md).
