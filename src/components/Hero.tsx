"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useSyncExternalStore } from "react";
import { brandSize, brandSrc, pieceArt, pieceSize, pieceSrc } from "@/content/art";
import { lookForHour, type SlotType } from "@/content/characters";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import Figure from "./Figure";
import Tee from "./Tee";

/**
 * The hero shirt dresses itself, one slot at a time, so you watch the pieces
 * swap rather than the whole outfit cut. It is the product demonstrating
 * itself before anyone has scrolled or clicked.
 */
const SLOTS: SlotType[] = ["hair", "outfit", "shoes"];
const CYCLE: Record<string, string[]> = {
  hair: ["hair1", "hair2", "hair3"],
  outfit: ["outfit1", "outfit2", "outfit3"],
  shoes: ["shoes1", "shoes2", "shoes3"],
};
const START: Record<string, number> = { hair: 0, outfit: 1, shoes: 2 };
const Z: Record<string, number> = { hair: 4, shoes: 3, outfit: 2 };

/**
 * The visitor's own time of day, as "9:38 PM|one last adventure before bed".
 * A primitive string, so the snapshot is stable until the minute turns over;
 * null on the server, so hydration matches and the line fills in afterwards.
 */
const clockNow = () => {
  const now = new Date();
  return `${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}|${lookForHour(now.getHours()).line}`;
};
const onMinute = (notify: () => void) => {
  const t = setInterval(notify, 20_000);
  return () => clearInterval(t);
};

const RIBBON_TEXT = "Free US shipping on every kit · 30-day returns · ";
const RIBBON_REPEATS = 4;
const RIBBON_PATH = "M-30 400C90 300 170 470 300 390S510 300 640 380";

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stamp = useSyncExternalStore(onMinute, clockNow, () => null);
  const clock = stamp ? { time: stamp.split("|")[0], line: stamp.split("|")[1] } : null;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const heroTee = el.querySelector<HTMLElement>("#heroTee");

      // the headline number counts up (the server ships "27", so it never flashes down)
      const countEl = el.querySelector<HTMLElement>("#lookCount");
      if (reducedMotion()) return;

      if (countEl) {
        const n = { v: 0 };
        countEl.textContent = "0";
        gsap.to(n, {
          v: 27,
          duration: 1.5,
          delay: 0.65,
          ease: "power2.out",
          onUpdate: () => {
            countEl.textContent = String(Math.round(n.v));
          },
        });
      }

      // every endless loop here, so they can all stop when the hero is off screen
      const loops: ReturnType<typeof gsap.to>[] = [];
      let inView = true;
      const loop = (t: ReturnType<typeof gsap.to>) => {
        t.paused(!inView);
        loops.push(t);
      };

      // The shirt leads: it drops in first and the copy assembles beside it.
      gsap
        .timeline({
          defaults: { ease: "back.out(1.5)" },
          delay: 0.1,
          onComplete: () => {
            if (heroTee) loop(gsap.to(heroTee, { y: -14, duration: 3.6, repeat: -1, yoyo: true, ease: "sine.inOut" }));
            loop(gsap.to(q("#heroCue svg"), { y: 6, duration: 0.85, repeat: -1, yoyo: true, ease: "sine.inOut" }));
          },
        })
        .from(q(".teeWrap"), { y: 70, scale: 0.9, opacity: 0, duration: 0.8 })
        .from(q("#heroTee .worn"), { scale: 0, opacity: 0, stagger: 0.09, duration: 0.5 }, "-=.35")
        .from(q("#heroLogo"), { scale: 0.72, opacity: 0, duration: 0.6 }, 0.15)
        .from(q(".heroline"), { y: 20, opacity: 0, duration: 0.45, ease: "power2.out" }, "-=.25")
        .from(q(".maths"), { y: 18, opacity: 0, duration: 0.4, ease: "power2.out" }, "-=.25")
        .from(q(".lede"), { y: 18, opacity: 0, duration: 0.4, ease: "power2.out" }, "-=.25")
        .from(q(".herocta > *"), { y: 16, opacity: 0, stagger: 0.08, duration: 0.4 }, "-=.2")
        .from(q(".trust span"), { y: 12, opacity: 0, stagger: 0.06, duration: 0.35 }, "-=.2")
        .from(q("#heroCue"), { opacity: 0, y: -10, duration: 0.4 }, "-=.1");

      // the kids bob on their own beats; the ribbon text drifts along its path
      loop(gsap.to(q(".heroKid.boy"), { y: -10, duration: 3.1, repeat: -1, yoyo: true, ease: "sine.inOut" }));
      loop(gsap.to(q(".heroKid.girl"), { y: -12, duration: 3.7, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.8 }));
      const tp = el.querySelector<SVGTextPathElement>("#ribbonText textPath");
      const label = el.querySelector<SVGTextElement>("#ribbonText");
      if (tp && label) {
        const one = label.getComputedTextLength() / RIBBON_REPEATS;
        if (one > 0) loop(gsap.to(tp, { attr: { startOffset: -one }, duration: one / 38, repeat: -1, ease: "none" }));
      }

      // swap one slot every couple of seconds, but only while the hero is on screen
      const at = { ...START };
      let turn = 0;
      const swap = () => {
        const t = SLOTS[turn++ % 3];
        at[t] = (at[t] + 1) % 3;
        const piece = el.querySelector<HTMLElement>(`#heroTee .worn[data-slot="${t}"]`);
        const img = piece?.querySelector("img");
        if (!piece || !img) return;
        const next = CYCLE[t][at[t]];
        gsap
          .timeline()
          .to(piece, { scale: 0.5, opacity: 0, rotate: -14, duration: 0.22, ease: "power2.in" })
          .add(() => {
            // each piece has its own spot on him: move the holder, not just the picture
            const pos = piece.parentElement;
            const { slot } = pieceArt("boy", next);
            if (pos) Object.assign(pos.style, { left: slot.cx + "%", top: slot.cy + "%", width: slot.w + "%" });
            img.src = pieceSrc("boy", next, 256);
            img.width = pieceSize("boy", next, 256).width;
            img.height = pieceSize("boy", next, 256).height;
          })
          .fromTo(
            piece,
            { scale: 1.45, opacity: 0, rotate: 12 },
            { scale: 1, opacity: 1, rotate: 0, duration: 0.52, ease: "back.out(2.4)" }
          );
      };
      let timer: ReturnType<typeof setInterval> | undefined;
      const io = new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          loops.forEach((t) => t.paused(!inView));
          clearInterval(timer);
          if (inView) timer = setInterval(swap, 1900);
        },
        { threshold: 0.25 }
      );
      io.observe(el);

      // the shirt leans toward the cursor
      let off: (() => void) | undefined;
      if (heroTee && matchMedia("(hover: hover)").matches) {
        const ry = gsap.quickTo(heroTee, "rotationY", { duration: 0.7, ease: "power3" });
        const rx = gsap.quickTo(heroTee, "rotationX", { duration: 0.7, ease: "power3" });
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 17);
          rx(((e.clientY - r.top) / r.height - 0.5) * -13);
        };
        const onLeave = () => {
          ry(0);
          rx(0);
        };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        off = () => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        };
      }

      return () => {
        clearInterval(timer);
        io.disconnect();
        off?.();
        if (countEl) countEl.textContent = "27";
      };
    },
    { scope: root }
  );

  return (
    <section id="hero" ref={root}>
      <div className="herogrid">
        <div>
          <img
            id="heroLogo"
            src={brandSrc("logo_light", 760)}
            {...brandSize("logo_light")}
            alt="Playweary: wear, swap, play"
          />
          <h1 className="heroline">
            One shirt. <em id="lookCount">27</em> different kids.
          </h1>
          <div className="maths">
            🕓{" "}
            <span id="clockText">
              {clock ? (
                <>
                  It is <b>{clock.time}</b> where you are: {clock.line}.
                </>
              ) : (
                "…"
              )}
            </span>
          </div>
          <p className="lede">
            One printed character on the shirt. Velcro hair, outfits and shoes that rip off and
            stick back on. Every kit comes with all three sets: <b>27 complete looks</b>, and it all
            goes in the same wash.
          </p>
          <div className="herocta">
            <button className="btn" data-scroll="#bench" type="button">
              Shop the kits
            </button>
            <button className="btn ghost" data-scroll="#bench" type="button">
              Dress them yourself
            </button>
          </div>
          <div className="trust">
            <span>OEKO-TEX cotton</span>
            <span>40-wash tested</span>
            <span>Height-based sizing</span>
            <span>30-day returns</span>
          </div>
        </div>
        <div className="heroTeeHolder">
          <div className="heroStage">
            <svg className="ribbon" viewBox="-30 290 700 200" aria-hidden="true">
              <path d={RIBBON_PATH} fill="none" stroke="#FCC006" strokeWidth="58" strokeLinecap="round" />
              <text id="ribbonText" className="ribbonText">
                <textPath href="#ribbonPath" startOffset="0">
                  {RIBBON_TEXT.repeat(RIBBON_REPEATS)}
                </textPath>
              </text>
              <path id="ribbonPath" d={RIBBON_PATH} fill="none" stroke="none" />
            </svg>
            <Figure character="boy" set={2} className="heroKid boy" />
            <Figure character="girl" set={1} className="heroKid girl" />
          <Tee id="heroTee" character="boy">
            <div className="pieceLayer">
              {SLOTS.map((t) => {
                const id = CYCLE[t][START[t]];
                const art = pieceArt("boy", id);
                return (
                  <div
                    key={t}
                    className="wornPos"
                    style={{ left: art.slot.cx + "%", top: art.slot.cy + "%", width: art.slot.w + "%", zIndex: Z[t] }}
                  >
                    <div className="worn" data-slot={t}>
                      <img src={pieceSrc("boy", id, 256)} {...pieceSize("boy", id, 256)} alt="" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Tee>
          </div>
        </div>
      </div>
      <div id="heroCue" aria-hidden="true">
        <span>scroll</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
