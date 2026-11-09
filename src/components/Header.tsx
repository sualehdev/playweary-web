"use client";

/* eslint-disable @next/next/no-img-element */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { cartCount } from "@/store/shop";
import { useShop } from "@/store/ShopProvider";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";

const LINKS = [
  // ["#shop", "Shop"], // the shop section is switched off
  ["#swap", "The swap"],
  ["#how", "How it works"],
  ["#bench", "Dress-Up Bench"],
  ["#collect", "Collect"],
  ["#run", "Dino run"],
  ["#mascot", "Puzzle"],
  ["#parents", "For parents"],
  ["/track", "Track order"],
] as const;

export default function Header() {
  const { state, openDrawer } = useShop();
  // Anchors live on the home page; elsewhere they lead back to it.
  const home = usePathname() === "/" ? "" : "/";
  const count = cartCount(state.cart);
  const btn = useRef<HTMLButtonElement>(null);
  const prev = useRef(count);
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuEl = useRef<HTMLDivElement>(null);

  // a little bump whenever something lands in the basket
  useGSAP(
    () => {
      if (count > prev.current && !reducedMotion() && btn.current) {
        gsap.fromTo(btn.current, { scale: 1 }, { scale: 1.14, duration: 0.16, yoyo: true, repeat: 1 });
      }
      prev.current = count;
    },
    { dependencies: [count] }
  );

  // The menu is a real overlay: Escape closes it, the page behind stops
  // scrolling, focus moves in and comes back out, and Tab stays inside.
  useEffect(() => {
    if (!menu) return;
    const root = document.documentElement;
    const trigger = menuBtn.current;
    root.style.overflow = "hidden";
    menuEl.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setMenu(false);
      if (e.key !== "Tab" || !menuEl.current) return;
      const f = [...menuEl.current.querySelectorAll<HTMLElement>("a,button")];
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
    // leaving desktop-to-mobile breakpoints should not strand an open menu
    const mq = matchMedia("(min-width: 901px)");
    const onMq = () => mq.matches && setMenu(false);
    mq.addEventListener("change", onMq);
    addEventListener("keydown", onKey);
    return () => {
      root.style.removeProperty("overflow");
      removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      trigger?.focus();
    };
  }, [menu]);

  return (
    <header className="bar">
      <button
        ref={menuBtn}
        className="menuBtn"
        type="button"
        aria-label="Menu"
        aria-expanded={menu}
        aria-controls="mobileMenu"
        onClick={() => setMenu((m) => !m)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={menu ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h11M4 17h16"} />
        </svg>
      </button>
      <a href={home + "#hero"} className="markLink" aria-label="Playweary, back to the top">
        <img className="mark" src={brandSrc("logo_light", 380)} {...brandSize("logo_light")} alt="" />
      </a>
      <nav aria-label="Main" className="deskNav">
        {LINKS.map(([href, label]) => (
          <a key={href} href={href.startsWith("#") ? home + href : href}>
            {label}
          </a>
        ))}
      </nav>
      <button
        id="cartBtn"
        ref={btn}
        type="button"
        onClick={openDrawer}
        aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      >
        <svg className="cartIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 4h2.5l2 11h10.5l2-8H7" />
          <circle cx="9.5" cy="19" r="1.4" />
          <circle cx="16.5" cy="19" r="1.4" />
        </svg>
        <span className="cartWord">Cart</span> <b id="cartCount">{count}</b>
      </button>

      <div id="mobileMenu" ref={menuEl} className={menu ? "open" : undefined} inert={!menu} role="dialog" aria-modal="true" aria-label="Menu">
        <nav aria-label="Menu">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href.startsWith("#") ? home + href : href} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
