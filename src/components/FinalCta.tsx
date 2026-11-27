/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CHARACTER_IDS } from "@/content/characters";
import { productPath } from "@/content/productPages";
import { PRODUCTS, money } from "@/content/products";
import { SHIRTS, SHIRT_SIZE, shirtSrc } from "@/content/shirts";
import { applyCatalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog.server";

const PERKS = ["Shirt plus all 3 sets in every kit", "30-day returns on unworn items", "Machine washable, ages 3 and up"];

/** The last push before the footer: a short promise and one row per kit. */
export default async function FinalCta() {
  const products = applyCatalog(PRODUCTS, await getCatalog());
  return (
    <section className="finalCta" aria-labelledby="finalCtaTitle">
      <div className="wrap">
        <div className="finalCtaCard">
          <div className="finalCtaCopy">
            <span className="eyebrow">Ready to play?</span>
            <h2 id="finalCtaTitle">One shirt. Every look.</h2>
            <ul>
              {PERKS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="finalCtaKits">
            {CHARACTER_IDS.map((c) => {
              const kit = products.find((p) => p.character === c)!;
              const { w, h } = SHIRT_SIZE[c];
              return (
                <Link key={c} href={productPath(c)} className={"finalKit " + c} aria-label={`${kit.name}, ${kit.was ? `was ${money(kit.was)}, now ` : ""}${money(kit.price)}`}>
                  <img src={shirtSrc(SHIRTS[c][0].id, 640)} width={w} height={h} alt="" loading="lazy" />
                  <span className="finalKitText">
                    <b>{kit.name}</b>
                    <small>{kit.sub}</small>
                  </span>
                  <span className="finalKitPrice">{kit.was ? <s>{money(kit.was)}</s> : null} {money(kit.price)}</span>
                  <span className="finalKitGo" aria-hidden="true">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
