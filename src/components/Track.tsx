"use client";

/**
 * Order tracking: open the link from the confirmation or email, or type the
 * order number and email, then watch the kit's character walk the parcel
 * along a storybook road, station by station. The stage is the order's real
 * status from the API (see lib/orders).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { money, productById } from "@/content/products";
import { ApiError } from "@/lib/api";
import { shippingById } from "@/lib/checkout";
import { confetti } from "@/lib/effects";
import { isEmail } from "@/lib/newsletter";
import { gsap, reducedMotion } from "@/lib/motion";
import {
  LAST_STAGE,
  STAGES,
  isFinal,
  listOrders,
  normalizeCode,
  normalizeRef,
  stageIndex,
  timeline,
  trackByCode,
  trackByNumber,
  type RecentOrder,
  type TrackedOrder,
} from "@/lib/orders";
import Figure from "./Figure";
import KitThumb from "./KitThumb";

const ROAD = "M70 230 C 190 60, 330 60, 430 170 S 660 290, 780 150 S 910 70, 940 100";
const VIEW = { w: 1000, h: 320 };
const STATION_AT = [0, 0.25, 0.5, 0.75, 1];
const ICONS = ["📝", "🎁", "🚚", "🏠", "🎉"];

const POLL_MS = 30_000;

const when = (d: Date) =>
  d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function Journey({ order, reached, onPick, picked }: { order: TrackedOrder; reached: number; onPick: (i: number) => void; picked: number }) {
  const road = useRef<SVGPathElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const progress = useRef({ p: 0 });
  const [stops, setStops] = useState<{ x: number; y: number }[]>([]);
  const character = productById(order.lines[0]?.id)?.character ?? "boy";

  const place = useCallback((p: number) => {
    const path = road.current;
    const el = mover.current;
    if (!path || !el) return;
    const pt = path.getPointAtLength(path.getTotalLength() * p);
    el.style.left = (pt.x / VIEW.w) * 100 + "%";
    el.style.top = (pt.y / VIEW.h) * 100 + "%";
  }, []);

  useEffect(() => {
    const path = road.current;
    if (!path) return;
    const len = path.getTotalLength();
    // The path is static, so the measured station positions are set once.
    setStops(STATION_AT.map((f) => path.getPointAtLength(len * f)));
  }, []);

  useEffect(() => {
    const target = STATION_AT[reached];
    if (reducedMotion()) {
      progress.current.p = target;
      place(target);
      return;
    }
    const tween = gsap.to(progress.current, {
      p: target,
      duration: Math.max(0.6, Math.abs(target - progress.current.p) * 5),
      ease: "power1.inOut",
      onUpdate: () => place(progress.current.p),
      onStart: () => mover.current?.classList.add("walking"),
      onComplete: () => {
        mover.current?.classList.remove("walking");
        if (reached === LAST_STAGE && mover.current) confetti(mover.current, 44);
      },
    });
    return () => {
      tween.kill();
    };
  }, [reached, place]);

  return (
    <div className="trScene" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <span className="trCloud c1" aria-hidden="true" />
      <span className="trCloud c2" aria-hidden="true" />
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="trRoad" aria-hidden="true" preserveAspectRatio="none">
        <path d={ROAD} className="trRoadEdge" />
        <path d={ROAD} className="trRoadBed" />
        <path ref={road} d={ROAD} className="trRoadDash" />
      </svg>
      {stops.map((s, i) => (
        <button
          key={STAGES[i].id}
          type="button"
          className={"trStop" + (i <= reached ? " done" : "") + (i === reached ? " now" : "") + (i === picked ? " picked" : "")}
          style={{ left: (s.x / VIEW.w) * 100 + "%", top: (s.y / VIEW.h) * 100 + "%" }}
          aria-label={`${STAGES[i].label}${i <= reached ? "" : ", not yet"}`}
          aria-pressed={i === picked}
          onClick={() => onPick(i)}
        >
          <span aria-hidden="true">{ICONS[i]}</span>
        </button>
      ))}
      <div className="trMover" ref={mover} aria-hidden="true">
        <span className="trParcel">📦</span>
        <Figure character={character} set={character === "girl" ? 2 : 1} />
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const a = order.shipTo;
  const paid = order.paymentStatus === "PAID";
  return (
    <div className="trOrder card">
      <h3 className="coH">Your order</h3>
      <ul className="coLines">
        {order.lines.map((l) => {
          const p = productById(l.id);
          return (
            <li key={l.id + l.size}>
              <KitThumb character={p?.character ?? "boy"} />
              <div className="coLineText">
                <b>{l.name}</b>
                <span>
                  Size {l.size} · Qty {l.q}
                </span>
              </div>
              <b className="coLinePrice">{money(l.lineTotal)}</b>
            </li>
          );
        })}
      </ul>
      <dl className="trFacts">
        <div>
          <dt>Ship to</dt>
          <dd>
            {a.firstName}, {a.city}, {a.state}
          </dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {shippingById(order.shipping).name} · {day(order.arrives[0])} to {day(order.arrives[1])}
            {order.isBackorder ? " (includes a backordered item)" : ""}
          </dd>
        </div>
        {order.carrierTrackingNumber ? (
          <div>
            <dt>Courier</dt>
            <dd>
              {order.carrier ?? "Courier"} · {order.carrierTrackingNumber}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Payment</dt>
          <dd>
            {order.payment === "cod" ? "Cash on delivery" : "PayPal"} · {money(order.total)} {paid ? "paid" : "due"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

type Lookup = { code: string } | { number: string; email: string };

export default function Track() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reached, setReached] = useState(0);
  const [picked, setPicked] = useState(0);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [copied, setCopied] = useState(false);
  const status = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const current = useRef<Lookup | null>(null);
  const reachedRef = useRef(0);

  const show = useCallback((found: TrackedOrder, focus: boolean) => {
    setError("");
    setOrder(found);
    const idx = stageIndex(found);
    // A background refresh only moves the view when the order has moved on.
    if (focus || idx !== reachedRef.current) {
      reachedRef.current = idx;
      setReached(idx);
      setPicked(idx);
    }
    setNumber(found.number);
    current.current = { code: found.trackingCode };
    window.history.replaceState(null, "", `/track?code=${found.trackingCode}`);
    if (focus) requestAnimationFrame(() => status.current?.focus());
  }, []);

  const lookup = useCallback(
    async (q: Lookup) => {
      setBusy(true);
      try {
        const found = "code" in q ? await trackByCode(q.code) : await trackByNumber(q.number, q.email);
        show(found, true);
      } catch (e) {
        setOrder(null);
        setError(
          e instanceof ApiError && e.status === 404
            ? "Hmm, Pip can't find an order with those details. Check the number and the email you used at checkout."
            : e instanceof ApiError
              ? e.message
              : "Something went wrong. Please try again."
        );
      } finally {
        setBusy(false);
      }
    },
    [show]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = normalizeRef(number);
    if (!ref) return setError("An order number looks like PW-123456.");
    if (!isEmail(email)) {
      emailRef.current?.focus();
      return setError("Enter the email you used at checkout.");
    }
    void lookup({ number: ref, email: email.trim() });
  };

  useEffect(() => {
    // Deferred a tick: storage and the URL only exist in the browser.
    const t = setTimeout(() => {
      setRecent(listOrders());
      const params = new URLSearchParams(window.location.search);
      const code = normalizeCode(params.get("code") ?? "");
      if (code) return void lookup({ code });
      // Old /track?ref= links: prefill the number and ask for the email.
      const ref = normalizeRef(params.get("ref") ?? "");
      if (ref) {
        setNumber(ref);
        emailRef.current?.focus();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [lookup]);

  // Orders still on their way are re-checked while the page is visible.
  useEffect(() => {
    if (!order || isFinal(order)) return;
    const t = setInterval(async () => {
      if (document.hidden || !current.current) return;
      try {
        const q = current.current;
        show("code" in q ? await trackByCode(q.code) : await trackByNumber(q.number, q.email), false);
      } catch {
        /* keep showing what we have */
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [order, show]);

  const events = order ? timeline(order, reached) : [];
  const ev = events[picked];
  const cancelled = order?.status === "CANCELLED";

  const copy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="coPage trPage">
      <main className="wrap coMain" id="main">
        <p className="eyebrow">Where&apos;s my kit?</p>
        <h1 className="coTitle">Track your order</h1>

        <form className="trLookup card" onSubmit={submit} noValidate>
          <div className="coRow">
            <div className="coField">
              <label htmlFor="tr-ref">Order number</label>
              <input
                id="tr-ref"
                value={number}
                placeholder="PW-123456"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "tr-err" : "tr-help"}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div className="coField">
              <label htmlFor="tr-email">Email used at checkout</label>
              <input
                id="tr-email"
                ref={emailRef}
                type="email"
                value={email}
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "tr-err" : "tr-help"}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Looking…" : "Track"}
          </button>
          {error ? (
            <p className="coErr" id="tr-err" role="alert">
              {error}
            </p>
          ) : (
            <p className="coSmall" id="tr-help">
              Both are on your order confirmation email. Or open the tracking link in that email.
            </p>
          )}
          {recent.length ? (
            <div className="trChips">
              {recent.slice(0, 3).map((o) => (
                <button key={o.number} type="button" className="trChip mine" onClick={() => void lookup({ code: o.trackingCode })}>
                  {o.number} · yours
                </button>
              ))}
            </div>
          ) : null}
        </form>

        {order && ev ? (
          <section className="trResult" aria-label={`Tracking for ${order.number}`}>
            <div className="trHead">
              <div>
                <h2 tabIndex={-1} ref={status}>
                  {order.number}
                </h2>
                <p className="trNow" aria-live="polite">
                  {cancelled ? (
                    <b>This order was cancelled.</b>
                  ) : (
                    <>
                      <b>{events[reached].label}.</b> {STAGES[reached].blurb}
                    </>
                  )}
                </p>
              </div>
              <button type="button" className="btn ghost sm" onClick={copy}>
                {copied ? "Copied!" : "Copy number"}
              </button>
            </div>

            {cancelled ? (
              <p className="trCancelled">
                {order.timeline[order.timeline.length - 1]?.message ?? "If you didn't expect this, reply to your order email and we'll sort it out."}
              </p>
            ) : (
              <Journey order={order} reached={reached} picked={picked} onPick={setPicked} />
            )}

            <div className="trCols">
              {cancelled ? (
                <div />
              ) : (
                <div>
                  <ol className="trSteps">
                    {events.map((e) => (
                      <li key={e.id} className={(e.done ? "done " : "") + (e.current ? "now " : "") + (e.index === picked ? "picked" : "")}>
                        <button type="button" onClick={() => setPicked(e.index)} aria-current={e.current ? "step" : undefined}>
                          <span className="trDot" aria-hidden="true">
                            {e.done ? "✓" : e.index + 1}
                          </span>
                          <span className="trStepText">
                            <b>{e.label}</b>
                            <span>{e.done ? (e.time ? when(e.time) : "Done") : "Coming up"}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div className="trDetail card" aria-live="polite">
                    <h3>
                      {ICONS[ev.index]} {ev.label}
                    </h3>
                    <p>{ev.done ? ev.blurb : "Not here yet. This is what happens next:"}</p>
                    <p className="coSmall">
                      {ev.where} · {ev.done ? ev.note : ev.blurb}
                    </p>
                  </div>
                </div>
              )}
              <OrderCard order={order} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
