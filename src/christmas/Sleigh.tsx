"use client";

import { useEffect, useState } from "react";
import Pic from "./Pic";

/** Seconds of quiet between one flight and the next. */
const PAUSE_MS = 12_000;

/**
 * Santa's sleigh crosses the top of the page again and again, trailing
 * sparkles. Decorative only. If public/christmas/sleigh.gif (or .png) exists
 * it is used, otherwise the built-in drawing.
 */
export default function Sleigh() {
  const [go, setGo] = useState(false);
  const [round, setRound] = useState(0);

  // wait, fly, wait, fly ... (not for visitors who prefer reduced motion)
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setGo(true), round === 0 ? 4500 : PAUSE_MS);
    return () => clearTimeout(t);
  }, [round]);

  if (!go) return null;

  return (
    <div className="xSleigh" aria-hidden="true" onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return; // only the flight, not the bobbing inside
        setGo(false);
        setRound((n) => n + 1);
      }}>
      <div className="xSleighBob">
        <span className="xTrail">
          {Array.from({ length: 6 }, (_, i) => (
            <b key={i} style={{ left: `${-8 - i * 40}px`, top: `${46 + ((i * 17) % 34) - 17}px`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
        <Pic
          name="sleigh"
          formats={["gif", "png"]}
          width={288}
          height={288}
          className="xSleighImg"
          fallback={
        <svg viewBox="0 0 280 110" width="230" height="90" focusable="false">
          {/* reindeer */}
          <g className="xDeer">
            <ellipse cx="236" cy="62" rx="22" ry="12" fill="#a8672f" stroke="#6b3d17" strokeWidth="3" />
            <rect x="222" y="68" width="5" height="22" rx="2.5" fill="#8a5224" />
            <rect x="244" y="68" width="5" height="22" rx="2.5" fill="#8a5224" />
            <circle cx="262" cy="46" r="11" fill="#a8672f" stroke="#6b3d17" strokeWidth="3" />
            <circle cx="272" cy="48" r="4.5" fill="#ff3b5c" className="xNose" />
            <circle cx="262" cy="43" r="2" fill="#200242" />
            <path d="M256 36 L250 20 M252 26 L244 24 M262 35 L266 18 M264 25 L272 22" stroke="#6b3d17" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* harness */}
          <path d="M150 64 Q190 56 216 62" stroke="#fcc006" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* sleigh */}
          <path d="M20 40 Q16 26 34 28 L140 30 Q164 32 160 54 L156 70 Q150 78 120 78 L48 78 Q24 78 22 62 Z" fill="#e0243f" stroke="#a3123c" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M30 52 H152" stroke="#fcc006" strokeWidth="5" strokeLinecap="round" />
          <path d="M10 92 Q70 98 150 92 Q164 90 166 78" fill="none" stroke="#fcc006" strokeWidth="5" strokeLinecap="round" />
          <path d="M44 78 V92 M120 78 V92" stroke="#c98f00" strokeWidth="4" />
          {/* Santa */}
          <circle cx="88" cy="22" r="14" fill="#ffd9b8" stroke="#d6a47c" strokeWidth="2.5" />
          <path d="M76 26 Q80 42 88 42 Q96 42 100 26 Q94 32 88 30 Q82 32 76 26Z" fill="#fff" />
          <path d="M74 16 Q78 -4 98 2 Q106 6 102 16 Z" fill="#e0243f" stroke="#a3123c" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="72" y="13" width="32" height="8" rx="4" fill="#fff" />
          <circle cx="104" cy="3" r="5" fill="#fff" />
          {/* gift sack */}
          <circle cx="52" cy="26" r="15" fill="#9f3eff" stroke="#6a18bd" strokeWidth="3" />
          <path d="M44 14 Q52 4 60 14" stroke="#fcc006" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
          }
        />
      </div>
    </div>
  );
}
