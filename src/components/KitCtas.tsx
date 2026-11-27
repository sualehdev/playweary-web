/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CHARACTER_IDS } from "@/content/characters";
import { productPath } from "@/content/productPages";
import { PRODUCTS, money } from "@/content/products";
import { SHIRTS, SHIRT_SIZE, shirtSrc } from "@/content/shirts";
import { applyCatalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog.server";
import "@/styles/shirt.css";

const COPY = {
  boy: { title: "Boys Shirt Kit", cta: "Shop the Boys kit" },
  girl: { title: "Girls Shirt Kit", cta: "Shop the Girls kit" },
} as const;

/** Home page: one card per kit, each leading to its own product page. */
export default async function KitCtas() {
  const products = applyCatalog(PRODUCTS, await getCatalog());
  return (
    <section id="bench">
      <div className="wrap">
        <div className="eyebrow">pick your kit</div>
        <h2>Boys and Girls Kits</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          One printed character on the shirt, plus velcro hair, outfits and shoes that rip off and stick back on. Every kit comes with all three sets.
        </p>
        <div className="kitCtas">
          {CHARACTER_IDS.map((c) => {
            const kit = products.find((p) => p.character === c)!;
            const first = SHIRTS[c][0];
            const { w, h } = SHIRT_SIZE[c];
            return (
              <Link key={c} href={productPath(c)} className="card kitCta" aria-label={`${COPY[c].title}, ${kit.was ? `was ${money(kit.was)}, now ` : ""}${money(kit.price)}`}>
                <span className="kitCtaImg" style={{ background: c === "boy" ? "#f4ede3" : "#ebe9ee" }}>
                  <img src={shirtSrc(first.id, 640)} width={w} height={h} alt={first.alt} loading="lazy" />
                </span>
                <span className="kitCtaBody">
                  <h3>{COPY[c].title}</h3>
                  <p>{kit.sub}. 3 variants in every kit.</p>
                  <b className="shirtPrice">{kit.was ? <s>{money(kit.was)}</s> : null} {money(kit.price)}</b>
                  <span className="btn">{COPY[c].cta}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
