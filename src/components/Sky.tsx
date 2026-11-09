"use client";

/**
 * The fixed sky, stars and moon behind the whole page. The show drives them
 * from its scroll progress through `setSkyProgress`; this component owns the
 * DOM and the idle motion (the moon's drift, the stars' twinkle).
 *
 * #sky is a gradient built from --sky-a / --sky-b. #stars sits at opacity 0 and
 * the moon below the horizon until the show gets late. Progress, not a tween,
 * decides all of it, so a reload or deep link past the show is still correct.
 */

import { useEffect, useRef } from "react";

type Tween = ReturnType<typeof gsap.to>;
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";

const SKY_A = ["#FFE8D6", "#E7F3FF", "#BFE4FF", "#CFE9FF", "#FFB784", "#7A4A9E", "#120A2E"];
const SKY_B = ["#FFC9A9", "#FFDCB4", "#EAF6FF", "#FFE0B0", "#FF8A6A", "#E0657F", "#3A1E5C"];
const DAY_TEXT = "#200242";
const NIGHT_TEXT = "#FFF1E2";

let apply: (p: number) => void = () => {};
/** 0 = dawn, 1 = deep night. Safe to call before the sky has mounted. */
export const setSkyProgress = (p: number) => apply(p);

/** Small deterministic PRNG so server and client draw the same stars. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const r = mulberry32(7);
  return Array.from({ length: 90 }, () => ({
    cx: (r() * 100).toFixed(2) + "%",
    // keep them out of the bottom quarter, where the ground sits
    cy: (r() * 74).toFixed(2) + "%",
    r: (r() * 1.3 + 0.5).toFixed(2),
    o: (r() * 0.6 + 0.35).toFixed(2),
  }));
})();

export default function Sky() {
  const starsRef = useRef<SVGSVGElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const idle = useRef<Tween[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const stars = starsRef.current;
    const moon = moonRef.current;
    apply = (p) => {
      const t = gsap.utils.clamp(0, 1, p);
      root.style.setProperty("--sky-a", String(gsap.utils.interpolate(SKY_A, t)));
      root.style.setProperty("--sky-b", String(gsap.utils.interpolate(SKY_B, t)));
      if (stars) stars.style.opacity = String(gsap.utils.clamp(0, 1, (t - 0.78) / 0.2) * 0.95);
      const night = gsap.utils.clamp(0, 1, (t - 0.74) / 0.22);
      // the moon and stars only move once they can be seen
      idle.current.forEach((t) => t.paused(night <= 0));
      if (moon) {
        moon.style.opacity = String(night);
        moon.style.bottom = -18 + night * 82 + "%"; // rises out of the horizon
        moon.style.left = 78 - night * 13 + "%"; // and drifts inward as it climbs
      }
      // Body text crosses to cream on the last stretch. Panels keep dark text
      // through the `.card, .prod, …` rule in the stylesheet.
      document.body.style.color = String(
        gsap.utils.interpolate(DAY_TEXT, NIGHT_TEXT, gsap.utils.clamp(0, 1, (t - 0.84) / 0.16))
      );
    };
    return () => {
      apply = () => {};
      root.style.removeProperty("--sky-a");
      root.style.removeProperty("--sky-b");
      document.body.style.removeProperty("color");
      stars?.style.removeProperty("opacity");
      moon?.removeAttribute("style");
    };
  }, []);

  // Motion that keeps going once the scrubbing stops, so a reader parked in the
  // night sections is not looking at a still image. Transform and child
  // opacity only, so none of it fights the inline styles `apply` writes. It
  // starts paused and only runs while the night is actually showing.
  useGSAP(() => {
    if (reducedMotion()) return;
    const moon = moonRef.current;
    const stars = starsRef.current;
    const paused = true; // `apply` starts them when night begins
    if (moon) gsap.set(moon, { xPercent: -50 });
    const tweens: Tween[] = [];
    if (moon)
      tweens.push(gsap.to(moon, { y: -16, scale: 1.03, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut", paused }));
    if (stars) {
      tweens.push(gsap.to(stars, { xPercent: -3, duration: 80, repeat: -1, yoyo: true, ease: "sine.inOut", paused }));
      // every other star twinkles on desktop; a third as many on a phone
      const step = matchMedia("(max-width: 700px)").matches ? 6 : 2;
      Array.from(stars.children).forEach((c, i) => {
        if (i % step) return;
        tweens.push(
          gsap.to(c, {
            opacity: gsap.utils.random(0.1, 0.35),
            duration: gsap.utils.random(0.9, 2.6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: gsap.utils.random(0, 3),
            paused,
          })
        );
      });
    }
    idle.current = tweens;
    return () => {
      idle.current = [];
    };
  }, []);

  return (
    <>
      <div id="sky" />
      <svg id="stars" ref={starsRef} aria-hidden="true">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#FFF6DC" opacity={s.o} />
        ))}
      </svg>
      <div id="moon" ref={moonRef} aria-hidden="true" />
      <div id="grain" aria-hidden="true" />
    </>
  );
}
