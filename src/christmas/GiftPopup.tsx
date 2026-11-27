"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { track } from "@/lib/track";
import { Present, Santa, Tree } from "./art";
import Pic from "./Pic";
import { KITS, OFFER } from "./config";

/** The gift pop-up. A proper dialog: focus moves in, Tab stays inside, Esc and the backdrop close it. */
export default function GiftPopup({ onClose }: { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus();
    track("xmas_popup_view");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !box.current) return;
      const items = box.current.querySelectorAll<HTMLElement>("a[href],button");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="xPopWrap" onClick={onClose}>
      <div
        className="xPop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="xPopTitle"
        tabIndex={-1}
        ref={box}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="xPopX" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="xPopLights" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
          ))}
        </div>
        <div className="xPopArt" aria-hidden="true">
          <span className="xFlakes">
            {Array.from({ length: 14 }, (_, i) => (
              <b key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * -1.1}s`, animationDuration: `${5 + (i % 4)}s` }} />
            ))}
          </span>
          <span className="xGlow" />
          <Pic name="tree" formats={["png"]} width={453} height={640} className="xTree" fallback={<Tree />} />
          <Pic name="santa" formats={["png"]} width={472} height={640} className="xSanta" fallback={<Santa />} />
          <span className="xSash">{OFFER.on ? "Christmas offer" : "Christmas gifts"}</span>
          <span className="xOfferBadge">
            <Pic name="santa" formats={["gif", "png"]} width={288} height={288} className="xOfferSanta" fallback={<Santa className="xOfferSanta" />} />
            <b>{OFFER.on ? "Special offer" : "Gift ideas"}</b>
          </span>
        </div>
        <div className="xPopBody">
          <p className="xKicker">
            <Present className="xKickIcon" hue="red" /> {OFFER.on ? "Special Christmas offer" : "A gift they will open first"}
          </p>
          <h2 id="xPopTitle">
            {OFFER.on ? (
              <>
                {OFFER.text} <em>this Christmas</em>
              </>
            ) : (
              <>
                Give them a gift that <em>keeps on giving</em>
              </>
            )}
          </h2>
          {OFFER.on ? (
            <div className="xCode">
              <span>
                Special <b>{OFFER.text}</b> on every kit. No code needed.
              </span>
            </div>
          ) : null}
          <ul className="xPopList">
            <li>
              <b>Endless</b> different looks from one shirt
            </li>
            <li>Velcro hair, outfits and shoes to swap</li>
            <li>No batteries, no screens, and it all goes in the same wash</li>
          </ul>
          <div className="xPopCtas">
            <Link className="btn xShine" href={KITS.girl.href} onClick={() => { track("xmas_popup_click", { kit: "girl" }); onClose(); }}>
              {KITS.girl.label}
            </Link>
            <Link className="btn pink xShine" href={KITS.boy.href} onClick={() => { track("xmas_popup_click", { kit: "boy" }); onClose(); }}>
              {KITS.boy.label}
            </Link>
          </div>
          <button type="button" className="xLater" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
