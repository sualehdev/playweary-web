"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * The shirt picker that replaces the Dress-Up Bench (Bench.tsx is kept, switched
 * off in app/page.tsx). Pick a boy or girl, then a set: the shirt photo changes.
 * The photo also has left and right arrows that loop forever, dots, swipe and
 * the arrow keys, all driving the same selection as the set buttons.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_SIZE, SIZES, kitId, money } from "@/content/products";
import { pieceSize, pieceSrc } from "@/content/art";
import { SHIRTS, SHIRT_SIZE, shirtSrc } from "@/content/shirts";
import type { CharacterId } from "@/content/characters";
import { flyToCart } from "@/lib/effects";
import { DEFAULT_SHIPPING, shipPrice } from "@/lib/settings";
import { useShop } from "@/store/ShopProvider";
import CharacterToggle from "./CharacterToggle";
import "@/styles/shirt.css";

type Dir = "next" | "prev";

type Props = {
  /** Fixes the gallery to one character (a product page). Omit to follow the site-wide Boy/Girl toggle. */
  character?: CharacterId;
  /** The product page's title is its h1; the home page would use h2. */
  heading?: "h1" | "h2";
  /** Standard shipping rate in cents (an admin setting). */
  shippingCents?: number;
};

export default function ShirtGallery({ character: fixed, heading: Heading = "h2", shippingCents = DEFAULT_SHIPPING.standardCents }: Props) {
  const { state, add, openDrawer, productById } = useShop();
  const character: CharacterId = fixed ?? state.character;
  const shirts = SHIRTS[character];
  const { w, h } = SHIRT_SIZE[character];

  const [index, setIndex] = useState<Record<CharacterId, number>>({ boy: 0, girl: 0 });
  const [dir, setDir] = useState<Dir>("next");
  const current = index[character];
  const swipe = useRef<number | null>(null);

  const go = (to: number, d?: Dir) => {
    const n = shirts.length;
    const next = ((to % n) + n) % n;
    if (next === current) return;
    setDir(d ?? (next > current ? "next" : "prev"));
    setIndex((all) => ({ ...all, [character]: next }));
  };
  const step = (by: 1 | -1) => go(current + by, by === 1 ? "next" : "prev");

  // Buying: the kit is the shirt plus all three sets, so the choice here is a preview.
  const [size, setSize] = useState(DEFAULT_SIZE);
  const kit = productById(kitId(character))!;
  const canBuy = kit.available !== false;
  // Mobile: a bottom bar with the price and Add to cart once the main button scrolls away.
  const buyBtn = useRef<HTMLButtonElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = buyBtn.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const addKit = (from: Element) => {
    if (!canBuy) return;
    add(kit.id, size);
    flyToCart(from);
    openDrawer();
  };

  return (
    <section id="bench" className={"shirtHero " + character}>
      <div className="wrap">
        <div className="shirtCard">
          <div className="shirtMedia">
            <div
              className="shirtStage"
              role="group"
              aria-roledescription="carousel"
              aria-label={`${character === "boy" ? "Boy" : "Girl"} shirt, variant ${current + 1} of ${shirts.length}`}
              tabIndex={0}
              style={{ aspectRatio: `${w} / ${h}` }}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") step(1);
                else if (e.key === "ArrowLeft") step(-1);
              }}
              onPointerDown={(e) => (swipe.current = e.clientX)}
              onPointerUp={(e) => {
                if (swipe.current === null) return;
                const dx = e.clientX - swipe.current;
                swipe.current = null;
                if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
              }}
              onPointerCancel={() => (swipe.current = null)}
            >
              {shirts.map((s, i) => (
                <img
                  key={s.id}
                  className={"shirtImg" + (i === current ? " on " + dir : "")}
                  src={shirtSrc(s.id, 1100)}
                  srcSet={`${shirtSrc(s.id, 640)} 640w, ${shirtSrc(s.id, 1100)} 1100w`}
                  sizes="(max-width: 860px) 92vw, 600px"
                  width={w}
                  height={h}
                  alt={i === current ? s.alt : ""}
                  aria-hidden={i === current ? undefined : true}
                  draggable={false}
                />
              ))}
              <button type="button" className="shirtArrow prev" aria-label="Previous variant" onClick={() => step(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button type="button" className="shirtArrow next" aria-label="Next variant" onClick={() => step(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="shirtDots" role="group" aria-label="Choose a variant">
              {shirts.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={"shirtDot" + (i === current ? " on" : "")}
                  aria-label={`Show variant ${i + 1}`}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => go(i)}
                />
              ))}
            </div>
          </div>

          <div className="shirtInfo">
            {fixed ? null : <CharacterToggle label="Boy or girl shirt" />}
            <Heading>{kit.name}</Heading>
            <p className="shirtPrice">
              {kit.was ? <s>{money(kit.was)}</s> : null} <b>{money(kit.price)}</b>
            </p>
            <p className={"stockLine " + (canBuy ? (kit.backorder ? "back" : "in") : "out")}>
              {canBuy ? (kit.backorder ? "Backorder: ships a little later" : "In stock") : "Out of stock"} · SKU {kit.id}
            </p>
            <p className="lede">
              {kit.sub}. {kit.looks}.
            </p>

            <div className="variantHead">
              <h3 id="variantLabel">Variants</h3>
              <span>Tap one to see it on the shirt</span>
            </div>
            <div className="variants" role="radiogroup" aria-labelledby="variantLabel">
              {shirts.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={i === current}
                  aria-label={`Variant ${i + 1}`}
                  className={"variantBox" + (i === current ? " on" : "")}
                  onClick={() => go(i)}
                >
                  <img src={pieceSrc(character, `hair${i + 1}`, 256)} {...pieceSize(character, `hair${i + 1}`, 256)} alt="" />
                  <small>Variant {i + 1}</small>
                </button>
              ))}
            </div>
            <p className="variantNote" role="note">
              <b>All 3 variants come in every kit.</b> You get the shirt plus all three variants to swap, not just the one you are looking at.
            </p>

            <div className="sizeRow">
              <span id="sizeLabel">Size</span>
              <div className="sizes" role="radiogroup" aria-labelledby="sizeLabel">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={size === s.id}
                    className={"sizeChip" + (size === s.id ? " on" : "")}
                    title={`${s.inches} tall (${s.cm})`}
                    onClick={() => setSize(s.id)}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
              <Link className="sizeGuide" href="#sizes">
                Size guide
              </Link>
            </div>
            <button className="btn wide" id="addLook" ref={buyBtn} type="button" disabled={!canBuy} onClick={(e) => addKit(e.currentTarget)}>
              {canBuy ? `Add to cart · ${money(kit.price)}` : "Not available right now"}
            </button>
            {canBuy && kit.backorder ? (
              <p className="buyNote" role="note">
                {kit.backorderNote || "On backorder: order now and we'll ship it as soon as it's back, a little later than usual."}
              </p>
            ) : null}
            <ul className="buyPerks" aria-label="Shipping and returns">
              <li>
                <b>{shipPrice(shippingCents)} shipping</b>
                <span>Standard US, 5 to 7 days</span>
              </li>
              <li>
                <b>30-day returns</b>
                <span>Free return shipping</span>
              </li>
              <li>
                <b>Ships fast</b>
                <span>Before 2 pm ET, same day</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className={"stickyBuy" + (stuck ? " show" : "")} aria-hidden={!stuck}>
        <span>
          <b>{kit.name}</b>
          <small>{money(kit.price)} · size {size}</small>
        </span>
        <button className="btn sm" type="button" tabIndex={stuck ? 0 : -1} disabled={!canBuy} onClick={(e) => addKit(e.currentTarget)}>
          {canBuy ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </section>
  );
}
