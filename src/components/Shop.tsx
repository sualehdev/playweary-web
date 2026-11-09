"use client";

/* eslint-disable @next/next/no-img-element */
import { brandSize, brandSrc, pieceSize, pieceSrc } from "@/content/art";
import { DEFAULT_SIZE, money, productsFor, type Product } from "@/content/products";
import { flyToCart } from "@/lib/effects";
import { useShop } from "@/store/ShopProvider";
import CharacterToggle from "./CharacterToggle";

function ProductCard({ p, onAdd }: { p: Product; onAdd: (from: Element) => void }) {
  return (
    <div className="prod" id={"prod-" + p.id}>
      {p.flag ? <span className="flag">{p.flag}</span> : null}
      <div className={"shot" + (p.shots[0] === "tee" ? " tee" : "")}>
        {p.shots.map((s, i) =>
          s === "tee" ? (
            <img
              key={i}
              src={brandSrc("tee_print", 520)}
              {...brandSize("tee_print")}
              alt=""
              style={{ borderRadius: 6 }}
            />
          ) : (
            <img
              key={i}
              src={pieceSrc(s.character, s.id, 256)}
              {...pieceSize(s.character, s.id, 256)}
              alt=""
            />
          )
        )}
      </div>
      <h3>{p.name}</h3>
      <p className="sub">{p.sub}</p>
      <div className="looks">{p.looks}</div>
      <div className="price">
        {money(p.price)}
        {p.per || ""}
        {p.was ? <s>{money(p.was)}</s> : null}
      </div>
      <button className="btn sm wide" type="button" onClick={(e) => onAdd(e.currentTarget)}>
        {p.cta || "Add to basket"}
      </button>
    </div>
  );
}

export default function Shop() {
  const { state, add } = useShop();
  const products = productsFor(state.character);
  return (
    <section id="shop">
      <div className="wrap">
        <div className="eyebrow">the shop</div>
        <h2>One shirt. Three sets. Every look.</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          Each set is a complete character in one small box: hair or a hat, an outfit, shoes and, for
          her, a bag. Buy a shirt, then collect sets.
        </p>
        <div style={{ marginTop: "1.2rem" }}>
          <CharacterToggle label="Shop sets for" />
        </div>
        <div className="shopgrid" id="shopGrid">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={(from) => {
                add(p.id, DEFAULT_SIZE);
                flyToCart(from);
              }} />
          ))}
        </div>
        <p className="note" style={{ marginTop: "1rem" }}>
          Every product on this page is a fixed, pre-made item from a bulk run. Nothing is printed to
          order.
        </p>
      </div>
    </section>
  );
}
