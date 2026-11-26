"use client";

import { useEffect, useRef } from "react";

/** A light snowfall on a canvas. Stops when the tab is hidden; not drawn at all for reduced motion. */
export default function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let flakes: { x: number; y: number; r: number; s: number; d: number }[] = [];
    const dpr = 1; // snow is soft anyway: no need for a retina-size canvas

    const size = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? 18 : 32;
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3,
        s: 0.4 + Math.random() * 0.9,
        d: Math.random() * Math.PI * 2,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.s;
        f.d += 0.012;
        f.x += Math.sin(f.d) * 0.5;
        if (f.y > h + 6) {
          f.y = -6;
          f.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    size();
    run();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);

  return <canvas ref={ref} className="xSnow" aria-hidden="true" />;
}
