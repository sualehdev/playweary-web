"use client";

/**
 * Small one-off effects. Each one builds throwaway DOM, animates it, and
 * removes it, so nothing lingers in React's tree. All are skipped under
 * reduced motion.
 */

import { gsap, reducedMotion } from "./motion";

const COLOURS = ["#FCC006", "#FF2D60", "#81DF40", "#9F3EFF"];

/** A burst of confetti from the middle of `from`. */
export function confetti(from: Element, count = 28) {
  if (reducedMotion()) return;
  const r = from.getBoundingClientRect();
  const x0 = r.left + r.width / 2;
  const y0 = r.top + r.height / 2;
  const bits = Array.from({ length: count }, (_, i) => {
    const b = document.createElement("i");
    Object.assign(b.style, {
      position: "fixed",
      left: x0 + "px",
      top: y0 + "px",
      width: "10px",
      height: "10px",
      borderRadius: i % 3 ? "2px" : "50%",
      background: COLOURS[i % COLOURS.length],
      zIndex: "95",
      pointerEvents: "none",
    });
    document.body.appendChild(b);
    return b;
  });
  gsap.to(bits, {
    x: () => gsap.utils.random(-170, 170),
    y: () => gsap.utils.random(-210, -40),
    rotate: () => gsap.utils.random(-540, 540),
    duration: 0.7,
    ease: "power2.out",
  });
  gsap.to(bits, {
    y: "+=260",
    opacity: 0,
    duration: 0.8,
    delay: 0.65,
    ease: "power1.in",
    onComplete: () => bits.forEach((b) => b.remove()),
  });
}

/** A small token that arcs from `from` into the basket button. */
export function flyToCart(from: Element, colour = "#9F3EFF") {
  const target = document.getElementById("cartBtn");
  if (reducedMotion() || !target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement("i");
  Object.assign(dot.style, {
    position: "fixed",
    left: a.left + a.width / 2 - 11 + "px",
    top: a.top + a.height / 2 - 11 + "px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: colour,
    border: "3px solid #fff",
    boxShadow: "0 6px 14px rgba(32,2,66,.3)",
    zIndex: "95",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap
    .timeline({ onComplete: () => dot.remove() })
    .to(dot, { x: dx * 0.5, y: dy * 0.5 - 70, scale: 1.25, duration: 0.28, ease: "power2.out" })
    .to(dot, { x: dx, y: dy, scale: 0.35, opacity: 0.9, duration: 0.34, ease: "power2.in" });
}
