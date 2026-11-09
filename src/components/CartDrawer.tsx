"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { money, productById } from "@/content/products";
import { cartCount, cartTotal } from "@/store/shop";
import { useShop } from "@/store/ShopProvider";
import KitThumb from "./KitThumb";

export default function CartDrawer() {
  const { state, closeDrawer, setQty } = useShop();
  const { cart, drawerOpen } = state;
  const n = cartCount(cart);
  const panel = useRef<HTMLElement>(null);

  // Escape closes; focus moves in on open and back to the basket button on close.
  useEffect(() => {
    if (!drawerOpen) return;
    const opener = document.getElementById("cartBtn");
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]),input,a[href]")].filter(
        (el) => !el.closest("[hidden]")
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div id="scrim" className={drawerOpen ? "on" : undefined} onClick={closeDrawer} />
      {/* `inert` while closed keeps the off-screen drawer out of the tab order. */}
      <aside
        id="drawer"
        ref={panel}
        className={drawerOpen ? "open" : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        inert={!drawerOpen}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Your cart</h3>
          <button className="btn ghost sm" id="closeDrawer" type="button" onClick={closeDrawer}>
            Close
          </button>
        </div>
        <table id="cartTable">
          <tbody>
            {cart.map((l) => {
              const p = productById(l.id);
              if (!p) return null;
              const label = `${p.name}, size ${l.size}`;
              return (
                <tr key={l.id + l.size}>
                  <td>
                    <div className="cartLine">
                      <KitThumb character={p.character ?? "boy"} />
                      <div>
                        <b>{p.name}</b>
                        <div className="cartMeta">Size {l.size} · shirt + all 3 sets</div>
                        <div className="qty" role="group" aria-label={`Quantity of ${label}`}>
                          <button type="button" aria-label={`One fewer ${label}`} onClick={() => setQty(l.id, l.size, l.q - 1)}>
                            −
                          </button>
                          <span aria-live="polite">{l.q}</span>
                          <button type="button" aria-label={`One more ${label}`} onClick={() => setQty(l.id, l.size, l.q + 1)}>
                            +
                          </button>
                          <button type="button" className="rm" onClick={() => setQty(l.id, l.size, 0)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{money(p.price * l.q)}</td>
                </tr>
              );
            })}
            {n > 0 ? (
              <tr>
                <td>
                  <strong>Subtotal</strong>
                </td>
                <td>{money(cartTotal(cart))}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <p id="cartEmpty" className="note" hidden={n > 0}>
          Your cart is empty. Dress a character on the bench, pick a size and add their kit.
        </p>
        <div id="cartFoot" hidden={n === 0}>
          <p style={{ fontSize: ".85rem", opacity: 0.8 }}>
            Free US shipping on every kit · 30-day returns · OEKO-TEX cotton · sized by height.
          </p>
          <Link className="btn wide" href="/checkout" onClick={closeDrawer}>
            Checkout · {money(cartTotal(cart))}
          </Link>
          <p style={{ fontSize: ".85rem", textAlign: "center", marginTop: ".6rem" }}>
            <Link href="/track" onClick={closeDrawer}>
              Track an order
            </Link>
          </p>
        </div>
      </aside>
    </>
  );
}
