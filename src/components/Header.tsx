"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { cartCount } from "@/store/shop";
import { useShop } from "@/store/ShopProvider";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";

/** [href, label, kind]: "kit" links are the product pages, "page" links are home-page anchors. */
const LINKS = [
  ["/products/boy-shirt-kit", "Boys Kit", "kit"],
  ["/products/girl-shirt-kit", "Girls Kit", "kit"],
  ["#swap", "The swap", "page"],
  ["#how", "How it works", "page"],
  ["#collect", "Collect", "mobile"],
  ["#run", "Dino run", "mobile"],
  ["#mascot", "Puzzle", "mobile"],
  ["#parents", "For parents", "page"],
  ["/track", "Track order", "page"],
  ["/contact", "Contact", "page"],
] as const;

/**
 * A link that never reloads the site. On the home page, `#section` links stay plain anchors
 * (PageMotion scrolls them smoothly); everywhere else they are client-side navigations.
 */
function NavLink({ href, home, ...rest }: { href: string; home: string } & Omit<React.ComponentProps<"a">, "href">) {
  const target = href.startsWith("#") ? home + href : href;
  if (target.startsWith("#")) return <a href={target} {...rest} />;
  return <Link href={target} {...rest} />;
}

export default function Header() {
  const { state, openDrawer } = useShop();
  // Anchors live on the home page; elsewhere they lead back to it.
  const home = usePathname() === "/" ? "" : "/";
  const units = cartCount(state.cart); // for the bump: adding another of the same kit still bumps
  const count = state.cart.length; // the badge: how many different products are in the cart
  const btn = useRef<HTMLButtonElement>(null);
  const prev = useRef(units);
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuEl = useRef<HTMLDivElement>(null);

  // a little bump whenever something lands in the basket
  useGSAP(
    () => {
      if (units > prev.current && !reducedMotion() && btn.current) {
        gsap.fromTo(btn.current, { scale: 1 }, { scale: 1.14, duration: 0.16, yoyo: true, repeat: 1 });
      }
      prev.current = units;
    },
    { dependencies: [units] }
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
      <NavLink href="#hero" home={home} className="markLink" aria-label="Playweary, back to the top">
        <img className="mark" src={brandSrc("logo_light", 380)} {...brandSize("logo_light")} alt="" />
      </NavLink>
      <nav aria-label="Main" className="deskNav">
        {LINKS.filter(([, , kind]) => kind !== "mobile").map(([href, label, kind]) => (
          <NavLink key={href} href={href} home={home} className={kind === "kit" ? "navKit" : undefined}>
            {label}
          </NavLink>
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
            <NavLink key={href} href={href} home={home} onClick={() => setMenu(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
