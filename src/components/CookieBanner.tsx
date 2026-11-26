"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from "@/lib/consent";

/**
 * The cookie notice. Shown until the shopper chooses; reopened by the footer's
 * "Cookie settings" link. Reject is as easy as Accept. Essential cookies (basket,
 * checkout) are always on and need no consent, so only analytics and marketing
 * are switchable.
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Read after mount: storage only exists in the browser.
    const t = setTimeout(() => {
      const c = readConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
      } else setOpen(true);
    }, 600);
    const reopen = () => {
      returnTo.current = document.activeElement as HTMLElement | null;
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      clearTimeout(t);
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, []);

  useEffect(() => {
    if (open && custom) box.current?.focus();
  }, [open, custom]);

  const choose = (a: boolean, m: boolean) => {
    saveConsent({ analytics: a, marketing: m });
    setAnalytics(a);
    setMarketing(m);
    setOpen(false);
    setCustom(false);
    returnTo.current?.focus();
    returnTo.current = null;
  };

  if (!open) return null;

  return (
    <div className="ckBanner" role="dialog" aria-label="Cookie settings" aria-describedby="ck-text" tabIndex={-1} ref={box}>
      <div className="ckBody">
        <h2>Cookies</h2>
        <p id="ck-text">
          We use essential cookies to run the store. With your OK we also use analytics and advertising cookies to see what works and measure our ads. Read our{" "}
          <Link href="/cookie-policy">Cookie Policy</Link>.
        </p>
        {custom ? (
          <div className="ckOptions">
            <label className="ckRow ckLocked">
              <span>
                <b>Essential</b>
                <small>Keeps your basket and checkout working. Always on.</small>
              </span>
              <input type="checkbox" checked disabled aria-label="Essential cookies, always on" />
            </label>
            <label className="ckRow">
              <span>
                <b>Analytics</b>
                <small>Counts visits and shows which pages help.</small>
              </span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            </label>
            <label className="ckRow">
              <span>
                <b>Advertising</b>
                <small>Measures our ads on Google and Meta. Turning this off also opts you out of sharing for advertising.</small>
              </span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            </label>
          </div>
        ) : null}
      </div>
      <div className="ckActions">
        {custom ? (
          <button type="button" className="btn" onClick={() => choose(analytics, marketing)}>
            Save choices
          </button>
        ) : (
          <>
            <button type="button" className="btn" onClick={() => choose(true, true)}>
              Accept all
            </button>
            <button type="button" className="btn ghost" onClick={() => choose(false, false)}>
              Reject non-essential
            </button>
            <button type="button" className="ckLink" onClick={() => setCustom(true)}>
              Choose
            </button>
          </>
        )}
      </div>
    </div>
  );
}
