"use client";

/**
 * Page-level behaviour that belongs to no single section: smooth in-page
 * scrolling, the scroll reveals for the quiet sections, and keeping
 * ScrollTrigger's measurements honest once fonts and images have landed.
 * Renders nothing.
 */

import { gsap, reducedMotion, ScrollTrigger, useGSAP } from "@/lib/motion";

export default function PageMotion() {
  useGSAP(() => {
    const RM = reducedMotion();

    // One delegated handler covers both the [data-scroll] buttons and the
    // in-page anchors.
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const scroller = target?.closest<HTMLElement>("[data-scroll]");
      if (scroller) {
        document.querySelector(scroller.dataset.scroll!)?.scrollIntoView({ behavior: RM ? "auto" : "smooth" });
        return;
      }
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor) {
        const el = document.querySelector(anchor.getAttribute("href")!);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: RM ? "auto" : "smooth" });
        }
      }
    };
    document.addEventListener("click", onClick);

    // The pinned sections measure before late fonts and images arrive.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    if (document.readyState !== "complete") window.addEventListener("load", refresh, { once: true });

    if (!RM) {
      // sections that are switched off simply have nothing to reveal
      const reveal = (trigger: string, fn: () => void) =>
        document.querySelector(trigger) &&
        ScrollTrigger.create({ trigger, start: "top 82%", once: true, onEnter: fn });
      gsap.utils.toArray<HTMLElement>("main section h2").forEach((h) =>
        ScrollTrigger.create({
          trigger: h,
          start: "top 88%",
          once: true,
          onEnter: () => gsap.from(h, { y: 26, opacity: 0, duration: 0.6 }),
        })
      );
      reveal("#how", () => gsap.from(".step", { y: 34, opacity: 0, stagger: 0.09, duration: 0.5 }));
      reveal("#bench", () => {
        gsap.from(".stagebox", { y: 44, opacity: 0, duration: 0.6 });
        gsap.from("#bench .tray", { y: 34, opacity: 0, stagger: 0.09, duration: 0.5 });
      });
      reveal("#shop", () => gsap.from(".prod", { y: 36, opacity: 0, stagger: 0.07, duration: 0.5 }));
      reveal("#collect", () => gsap.from(".set", { y: 30, opacity: 0, stagger: 0.09, duration: 0.5 }));
      reveal("#reviews", () => gsap.from(".rev", { y: 26, opacity: 0, stagger: 0.08, duration: 0.45 }));
      reveal("#parents", () => gsap.from("#parents .card", { y: 26, opacity: 0, stagger: 0.07, duration: 0.45 }));
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
    };
  }, []);

  return null;
}
