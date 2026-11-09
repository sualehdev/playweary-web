"use client";

/**
 * The show. A real Lottie scrubbed by ScrollTrigger: the section pins and the
 * scroll position drives the animation frame rather than time. The Lottie's
 * keyframes are kept; its artwork is swapped for the real cut-outs at load, so
 * the pieces that fly on are the pieces you can buy.
 *
 * The same scroll progress drives the sky (see Sky.tsx), so the sun setting in
 * the Lottie and the sky going dark are one event.
 */

import { useRef } from "react";
import { buildShowData } from "@/content/showData";
import { rollLook, type Look } from "@/content/swapPieces";
import { gsap, reducedMotion, ScrollTrigger, useGSAP } from "@/lib/motion";
import { setSkyProgress } from "./Sky";

/** Small deterministic PRNG so the debris lands in the same place on server and client. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const BITS = (() => {
  const r = rng(11);
  const colours = ["#FCC006", "#FF2D60", "#81DF40", "#9F3EFF"];
  return Array.from({ length: 26 }, (_, i) => ({
    background: colours[i % 4],
    left: (10 + r() * 80).toFixed(1) + "%",
    top: (28 + r() * 40).toFixed(1) + "%",
  }));
})();

export default function Show() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const stage = section.querySelector<HTMLElement>("#lottieStage");
      const pin = section.querySelector<HTMLElement>("#showPin");
      if (!stage || !pin) return;
      const RM = reducedMotion();
      gsap.set(q(".showWord"), { xPercent: -50, yPercent: -50 });

      let cancelled = false;
      type Anim = { goToAndStop: (v: number, isFrame: boolean) => void; destroy: () => void };
      type LoadAnimation = (opts: Record<string, unknown>) => Anim & { addEventListener: (e: string, fn: () => void) => void };
      let anim: Anim | null = null;
      let totalFrames = 0;
      let loadAnimation: LoadAnimation | null = null;
      let frame = RM ? 135 : 0;

      // One boy set and one girl set per play; a fresh pair each time it replays.
      let look: Look = rollLook();
      let played = false;

      const mount = () => {
        if (!loadAnimation || cancelled) return;
        anim?.destroy();
        stage.innerHTML = "";
        const data = buildShowData(look);
        totalFrames = data.op - data.ip - 1;
        const a = loadAnimation({
          container: stage,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: data,
          rendererSettings: { preserveAspectRatio: "xMidYMax meet", progressiveLoad: false },
        });
        anim = a;
        a.addEventListener("DOMLoaded", () => {
          a.goToAndStop(frame, true);
          ScrollTrigger.refresh();
        });
      };

      // the light build: SVG renderer only, which is all this uses
      import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
        loadAnimation = lottie.loadAnimation as unknown as LoadAnimation;
        mount();
      });

      /** Back at the start after a play: dress them differently, unseen (nothing is on yet). */
      const maybeReplay = (progress: number) => {
        if (progress > 0.3) played = true;
        if (progress < 0.02 && played) {
          played = false;
          look = rollLook();
          frame = 0;
          mount();
        }
      };

      const setFrame = (p: number) => {
        frame = gsap.utils.clamp(0, 1, p) * totalFrames;
        if (anim && totalFrames) anim.goToAndStop(frame, true);
      };

      if (!RM) {
        setSkyProgress(0);
        gsap.set(q("#sun"), { bottom: "-38%" });
        const w = (i: number) => q(`.showWord[data-w="${i}"]`);
        const bits = q(".bit");
        // one 10-unit timeline; the Lottie frame and the sky are driven from the same progress
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // about three screens of scrolling, less on a phone: long enough to read
              // the day go by, short enough not to feel stuck once it is over
              end: () => "+=" + (innerWidth < 820 ? 1900 : 2500),
              invalidateOnRefresh: true,
              pin: pin,
              scrub: 0.4,
              anticipatePin: 1,
              onUpdate: (self) => {
                maybeReplay(self.progress);
                setFrame(self.progress);
                setSkyProgress(self.progress);
              },
              // scrolling up past the section also counts as starting over
              onLeaveBack: () => maybeReplay(0),
              // deep links and reloads can land below the section, where onUpdate
              // has not fired yet: refresh settles the sky to wherever we are
              onRefresh: (self) => setSkyProgress(self.progress),
            },
          })
          .to({}, { duration: 9.8 }, 0)
          .to(q("#sun"), { bottom: "20%", duration: 1.4, ease: "none" }, 0)
          .to(q("#sun"), { bottom: "44%", duration: 4, ease: "none" }, 1.4)
          .to(q("#sun"), { bottom: "-32%", duration: 1.8, ease: "none" }, 8.2)
          .fromTo(w(0), { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1, duration: 0.6 }, 0)
          .to(w(0), { opacity: 0, scale: 1.25, duration: 0.4 }, 1.2)
          .fromTo(w(1), { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1, duration: 0.5 }, 1.5)
          .to(w(1), { opacity: 0, scale: 1.25, duration: 0.4 }, 4.4)
          .fromTo(w(2), { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1, duration: 0.5 }, 4.8)
          .to(w(2), { opacity: 0, scale: 1.25, duration: 0.4 }, 7.8)
          .fromTo(w(3), { opacity: 0, scale: 0.7 }, { opacity: 0.95, scale: 1, duration: 0.5 }, 8.2)
          .to(w(3), { opacity: 0, duration: 0.5 }, 9.6)
          .fromTo(
            bits,
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, duration: 0.3, stagger: { each: 0.015, from: "center" } },
            5.0
          )
          .to(
            bits,
            {
              y: () => gsap.utils.random(-170, -50),
              x: () => gsap.utils.random(-240, 240),
              rotate: () => gsap.utils.random(-320, 320),
              duration: 1.5,
              ease: "power2.out",
            },
            5.1
          )
          .to(bits, { y: "+=340", opacity: 0, duration: 1.3, ease: "power1.in" }, 6.5)
          .fromTo(q("#zzz"), { opacity: 0, y: 20 }, { opacity: 1, y: -34, duration: 1.1 }, 8.6)
          .fromTo(q("#showCta"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 9.2)
          .to(q("#showHint"), { opacity: 0, duration: 0.4 }, 0.8);
        gsap.to(q("#showHint"), { y: 7, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
      } else {
        // reduced motion: no scrub, so the sky rests at the middle of the day
        setSkyProgress(0.35);
        gsap.set(q("#sun"), { bottom: "26%" });
        gsap.set(q('.showWord[data-w="2"]'), { opacity: 0.95 });
        gsap.set(q("#showCta"), { opacity: 1 });
        pin.style.height = "auto";
        pin.style.minHeight = "84svh";
        pin.style.padding = "3rem 0";
        gsap.set(q("#showHint"), { opacity: 0 });
      }

      return () => {
        cancelled = true;
        anim?.destroy();
        stage.innerHTML = "";
        setSkyProgress(0);
        if (RM) {
          pin.style.removeProperty("height");
          pin.style.removeProperty("min-height");
          pin.style.removeProperty("padding");
        }
      };
    },
    { scope: root }
  );

  return (
    <section id="show" ref={root}>
      <div id="showPin">
        <div id="sun" aria-hidden="true" />
        <div id="ground" aria-hidden="true" />
        <div className="showWord" data-w="0">
          WAKE
        </div>
        <div className="showWord" data-w="1">
          SWAP
        </div>
        <div className="showWord" data-w="2">
          PLAY
        </div>
        <div className="showWord" data-w="3">
          WEARY
        </div>
        <div id="zzz" aria-hidden="true">
          z z z
        </div>
        {BITS.map((b, i) => (
          <div key={i} className="bit" style={b} aria-hidden="true" />
        ))}

        <div id="lottieStage" aria-label="Playweary's boy and girl getting dressed, one piece at a time" role="img" />

        <div id="showCta">
          <button className="btn pink" data-scroll="#bench" type="button">
            Get the kit · $40
          </button>
        </div>
        <div id="showHint">keep scrolling, the day goes by ↓</div>
      </div>
    </section>
  );
}
