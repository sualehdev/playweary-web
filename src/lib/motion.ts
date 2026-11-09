"use client";

/**
 * One place that registers GSAP plugins and answers "should this move?".
 * Import `gsap` from here, never from "gsap" directly, so plugins are always
 * registered before anything uses them.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable, useGSAP);
  gsap.defaults({ ease: "power2.out" });
}

export { gsap, ScrollTrigger, Draggable, useGSAP };

/** Read at call time so a changed OS setting applies to the next animation. */
export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
