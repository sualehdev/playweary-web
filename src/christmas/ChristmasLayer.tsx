"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/track";
import { Present, Santa, Tree } from "./art";
import Pic from "./Pic";
import { BANNER_KEY, KITS, OFFER, POPUP_KEY, POPUP_ROUTES, QUIET_ROUTES, XMAS_END } from "./config";
import GiftPopup from "./GiftPopup";
import Lights from "./Lights";
import Sleigh from "./Sleigh";
import Snow from "./Snow";
import { useXmasActive } from "./useXmas";
import "./christmas.css";

/** `session`: remembered for this visit only (a new visit shows it again). Otherwise remembered for good. */
const seen = (key: string, session = false) => {
  try {
    return !!(session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return false;
  }
};
const remember = (key: string, session = false) => {
  try {
    (session ? sessionStorage : localStorage).setItem(key, "1");
  } catch {
    /* storage blocked: it just shows again next visit */
  }
};

/**
 * All the fixed Christmas decoration: snow, lights, a banner, the tree and
 * Santa, a gift button and the gift pop-up (once per visit). One component, so one
 * line in the root layout turns the whole thing on or off.
 */
export default function ChristmasLayer() {
  const active = useXmasActive();
  const path = usePathname();
  const [popup, setPopup] = useState(false);
  const [banner, setBanner] = useState(false);
  const quiet = QUIET_ROUTES.some((r) => path.startsWith(r));
  const decorated = active && !quiet;

  // keep the lights just under the header, whatever its height
  useEffect(() => {
    if (!decorated) return;
    const root = document.documentElement;
    const place = () => {
      const bar = document.querySelector("header.bar");
      root.style.setProperty("--xmas-top", (bar ? bar.getBoundingClientRect().bottom : 104) + "px");
    };
    place();
    const ro = new ResizeObserver(place);
    const bar = document.querySelector("header.bar");
    if (bar) ro.observe(bar);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [decorated, path]);

  // after the date: hide the home gift band too (it is part of the page)
  useEffect(() => {
    if (!active && Date.now() >= new Date(XMAS_END).getTime()) document.documentElement.dataset.xmasOver = "";
  }, [active]);

  useEffect(() => {
    if (!decorated) return;
    const t = setTimeout(() => setBanner(!seen(BANNER_KEY)), 1200);
    return () => clearTimeout(t);
  }, [decorated]);

  // the pop-up: once per visit, on the home page or a product page, never over the cookie notice
  useEffect(() => {
    if (!decorated || !POPUP_ROUTES(path) || seen(POPUP_KEY, true)) return;
    let tick: ReturnType<typeof setInterval> | undefined;
    const wait = setTimeout(() => {
      tick = setInterval(() => {
        if (document.querySelector(".ckBanner")) return;
        clearInterval(tick);
        setPopup(true);
      }, 1500);
    }, 7000);
    return () => {
      clearTimeout(wait);
      clearInterval(tick);
    };
  }, [decorated, path]);

  const close = useCallback(() => {
    remember(POPUP_KEY, true);
    setPopup(false);
  }, []);

  if (!decorated) return null;

  const onProduct = path.startsWith("/products/");

  return (
    <div className="xmas" data-product={onProduct || undefined}>
      <Snow />
      <Lights />
      {path === "/" ? <Sleigh /> : null}
      {banner ? (
        <div className="xBanner" role="region" aria-label="Christmas gifts">
          {OFFER.on ? (
            <p className="xBannerText">
              <Present className="xBannerIcon" hue="red" />
              <span>
                Special Christmas offer: <b>{OFFER.text}</b> every kit, no code needed
              </span>
            </p>
          ) : (
            <Link href={KITS.girl.href} onClick={() => track("xmas_banner_click")}>
              <Present className="xBannerIcon" hue="red" /> Gift a Playweary kit this Christmas
            </Link>
          )}
          <button
            type="button"
            className="xBannerClose"
            aria-label="Hide the Christmas banner"
            onClick={() => {
              remember(BANNER_KEY);
              setBanner(false);
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      <div className="xTreeCorner" aria-hidden="true">
        <Pic name="tree" formats={["png"]} width={453} height={640} className="xTree" fallback={<Tree />} />
      </div>
      <button
        type="button"
        className="xGiftBtn"
        aria-label={OFFER.on ? `Special Christmas offer: ${OFFER.text}` : "Christmas gift ideas"}
        onClick={() => {
          track("xmas_button_click");
          setPopup(true);
        }}
      >
        <Pic name="santa" formats={["gif", "png"]} width={288} height={288} className="xGiftSanta" fallback={<Santa className="xGiftSanta" />} />
        <Present className="xGiftBox" hue="violet" />
        {OFFER.on ? (
          <span className="xGiftBurst" aria-hidden="true">
            <b>{OFFER.text}</b>
          </span>
        ) : null}
        <span className="xGiftTag">{OFFER.on ? (
            <>
              <span className="xLong">Christmas </span>offer
            </>
          ) : (
            "Gifts"
          )}
        </span>
      </button>
      {popup ? <GiftPopup onClose={close} /> : null}
    </div>
  );
}
