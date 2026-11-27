"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useSyncExternalStore } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { lookForHour } from "@/content/characters";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import Figure from "./Figure";

/**
 * The hero shows the real shirt, and its three variants take turns, fading
 * from one to the next, so the product demonstrates itself before anyone has
 * scrolled or clicked.
 */
const SHIRT_LOOKS = [
  { src: "/shirts/hero-boy-blue.webp", alt: "Navy Playweary shirt with the boy in a blue hoodie" },
  { src: "/shirts/hero-girl-pink.webp", alt: "Pink Playweary shirt with the girl in a floral dress and sun hat" },
  { src: "/shirts/hero-boy-teal.webp", alt: "Playweary shirt with the boy in a teal sports kit" },
  { src: "/shirts/hero-girl-green.webp", alt: "Playweary shirt with the girl in a green top and denim trousers" },
  { src: "/shirts/hero-boy-safari.webp", alt: "Playweary shirt with the boy in a safari outfit" },
  { src: "/shirts/hero-girl-blue.webp", alt: "Playweary shirt with the girl in a blue top and denim skirt" },
];

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

const RIBBON_TEXT = "wear. swap. play. · ";
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

      if (reducedMotion()) return;

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

      // fade to the next variant every few seconds, but only while the hero is on screen
      const looks = Array.from(el.querySelectorAll<HTMLElement>("#heroTee .heroShirtImg"));
      let at = 0;
      const swap = () => {
        const from = looks[at];
        at = (at + 1) % looks.length;
        const to = looks[at];
        gsap.to(from, { opacity: 0, scale: 0.96, duration: 0.55, ease: "power2.inOut" });
        gsap.fromTo(to, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.inOut" });
      };
      let timer: ReturnType<typeof setInterval> | undefined;
      const io = new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          loops.forEach((t) => t.paused(!inView));
          clearInterval(timer);
          if (inView) timer = setInterval(swap, 3200);
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
            One shirt. <em>Endless</em> different looks.
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
            stick back on. Every kit comes with multiple sets for <b>endless complete looks</b>, and it
            all goes in the same wash.
          </p>
          <div className="herocta">
            <button className="btn" data-scroll="#bench" type="button">
              Shop the kits
            </button>
            <button className="btn ghost" data-scroll="#how" type="button">
              See how it works
            </button>
          </div>
          <div className="trust">
            <span>OEKO-TEX cotton</span>
            <span>40-wash tested</span>
            <span>Height-based sizing</span>
            <span>30-day returns on unworn items</span>
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
          <div className="teeWrap heroShirt" id="heroTee">
            {SHIRT_LOOKS.map((l, i) => (
              <img
                key={l.src}
                className="heroShirtImg"
                src={l.src}
                width={853}
                height={760}
                alt={i === 0 ? l.alt : ""}
                aria-hidden={i === 0 ? undefined : true}
                style={{ opacity: i === 0 ? 1 : 0 }}
                fetchPriority={i === 0 ? "high" : "low"}
              />
            ))}
          </div>
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
