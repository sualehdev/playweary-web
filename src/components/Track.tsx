"use client";

/**
 * Order tracking: open the link from the confirmation or email, or type the
 * order number, then watch the kit's character walk the parcel
 * along a storybook road, station by station. The stage is the order's real
 * status from the API (see lib/orders).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { money, productById } from "@/content/products";
import { ApiError } from "@/lib/api";
import { shippingById } from "@/lib/checkout";
import { confetti } from "@/lib/effects";
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
import "@/styles/track.css";

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
    <aside className="tkSide" aria-label="Order details">
      <section className="tkBox">
        <h3>Your order</h3>
        <ul className="tkLines">
          {order.lines.map((l) => {
            const p = productById(l.id);
            return (
              <li key={l.id + l.size}>
                <KitThumb character={p?.character ?? "boy"} />
                <div>
                  <b>{l.name}</b>
                  <span>
                    Size {l.size} · Qty {l.q}
                  </span>
                </div>
                <b>{money(l.lineTotal)}</b>
              </li>
            );
          })}
        </ul>
        {order.discount > 0 ? (
          <p className="tkTotal" style={{ fontSize: "0.95rem", color: "#0e5a22" }}>
            <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
            <b>−{money(order.discount)}</b>
          </p>
        ) : null}
        <p className="tkTotal">
          <span>Total {paid ? "(paid)" : "(due on delivery)"}</span>
          <b>{money(order.total)}</b>
        </p>
      </section>
      <section className="tkBox">
        <h3>Delivery</h3>
        <dl className="tkFacts">
          <div>
            <dt>Ship to</dt>
            <dd>
              {a.firstName}, {a.city}, {a.state}
            </dd>
          </div>
          <div>
            <dt>Method</dt>
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
            <dd>{order.payment === "cod" ? "Cash on delivery" : "PayPal"}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

type Lookup = { code: string } | { number: string };

export default function Track() {
  const [number, setNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reached, setReached] = useState(0);
  const [picked, setPicked] = useState(0);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [copied, setCopied] = useState(false);
  const status = useRef<HTMLHeadingElement>(null);
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
    // Number-only lookups stay number-only: the tracking code is never fetched for them.
    current.current = found.limited ? { number: found.number } : { code: found.trackingCode };
    window.history.replaceState(null, "", found.limited ? `/track?ref=${found.number}` : `/track?code=${found.trackingCode}`);
    if (focus) requestAnimationFrame(() => status.current?.focus());
  }, []);

  const lookup = useCallback(
    async (q: Lookup) => {
      setBusy(true);
      try {
        const found = "code" in q ? await trackByCode(q.code) : await trackByNumber(q.number);
        show(found, true);
      } catch (e) {
        setOrder(null);
        setError(
          e instanceof ApiError && e.status === 404
            ? "Hmm, Pip can't find an order with that number. Check it against your confirmation email."
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
    void lookup({ number: ref });
  };

  useEffect(() => {
    // Deferred a tick: storage and the URL only exist in the browser.
    const t = setTimeout(() => {
      setRecent(listOrders());
      const params = new URLSearchParams(window.location.search);
      const code = normalizeCode(params.get("code") ?? "");
      if (code) return void lookup({ code });
      const ref = normalizeRef(params.get("ref") ?? "");
      if (ref) void lookup({ number: ref });
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
        show("code" in q ? await trackByCode(q.code) : await trackByNumber(q.number), false);
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

  const delivered = !cancelled && reached === LAST_STAGE;
  const tone = cancelled ? "bad" : delivered ? "good" : "live";

  return (
    <div className="coPage trPage">
      <main className="wrap coMain tkMain" id="main">
        <header className="tkIntro">
          <p className="eyebrow">Where&apos;s my kit?</p>
          <h1 className="coTitle">Track your order</h1>
          <p className="tkLede">Enter the order number from your confirmation email to see where your kit is.</p>
          <form className="tkForm" onSubmit={submit} noValidate>
            <label htmlFor="tr-ref" className="sr">
              Order number
            </label>
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
            <button className="btn" type="submit" disabled={busy} aria-busy={busy}>
              {busy ? "Looking…" : "Track order"}
            </button>
          </form>
          {error ? (
            <p className="coErr tkMsg" id="tr-err" role="alert">
              {error}
            </p>
          ) : (
            <p className="tkMsg" id="tr-help">
              For the full details, open the tracking link in your email.
            </p>
          )}
          {recent.length ? (
            <div className="tkRecent">
              <span>Your recent orders</span>
              {recent.slice(0, 3).map((o) => (
                <button key={o.number} type="button" onClick={() => void lookup({ code: o.trackingCode })}>
                  {o.number}
                </button>
              ))}
            </div>
          ) : null}
        </header>

        {order && ev ? (
          <section className="tkResult" aria-label={`Tracking for ${order.number}`}>
            <div className={"tkStatus " + tone}>
              <div className="tkStatusTop">
                <div>
                  <p className="tkLabel">Order</p>
                  <h2 tabIndex={-1} ref={status}>
                    {order.number}
                  </h2>
                </div>
                <button type="button" className="tkCopy" onClick={copy}>
                  {copied ? "Copied!" : "Copy number"}
                </button>
              </div>
              <p className="tkPill">{cancelled ? "Cancelled" : events[reached].label}</p>
              <p className="tkNow" aria-live="polite">
                {cancelled ? "This order was cancelled." : STAGES[reached].blurb}
              </p>
              {!cancelled ? (
                <p className="tkEta">
                  {delivered ? (
                    <>
                      <span>Delivered</span>
                    </>
                  ) : (
                    <>
                      <span>Estimated delivery</span>
                      <b>
                        {day(order.arrives[0])} to {day(order.arrives[1])}
                      </b>
                    </>
                  )}
                </p>
              ) : null}
            </div>

            {cancelled ? (
              <p className="trCancelled">
                {order.timeline[order.timeline.length - 1]?.message ?? "If you didn't expect this, reply to your order email and we'll sort it out."}
              </p>
            ) : (
              <>
                <ol className="tkBar" aria-label="Progress">
                  {events.map((e) => (
                    <li key={e.id} className={(e.done ? "done " : "") + (e.current ? "now " : "") + (e.index === picked ? "picked" : "")}>
                      <button type="button" onClick={() => setPicked(e.index)} aria-current={e.current ? "step" : undefined}>
                        <span className="tkDot" aria-hidden="true">
                          {e.done ? "✓" : ICONS[e.index]}
                        </span>
                        <span className="tkBarLabel">{e.label}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <Journey order={order} reached={reached} picked={picked} onPick={setPicked} />
              </>
            )}

            <div className="tkCols">
              {cancelled ? null : (
                <section className="tkBox tkUpdates" aria-live="polite">
                  <h3>Updates</h3>
                  <ol>
                    {events.map((e) => (
                      <li key={e.id} className={(e.done ? "done " : "") + (e.current ? "now " : "") + (e.index === picked ? "picked" : "")}>
                        <button type="button" onClick={() => setPicked(e.index)}>
                          <span className="tkTick" aria-hidden="true" />
                          <span className="tkUpText">
                            <b>{e.label}</b>
                            <em>{e.done ? (e.time ? when(e.time) : "Done") : "Coming up"}</em>
                            {e.done || e.index === picked ? <span>{e.done ? e.note : e.blurb}</span> : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {order.limited ? (
                <p className="tkLimited">Want to see what&apos;s in the parcel? Open the tracking link in your order email for the full details.</p>
              ) : (
                <OrderCard order={order} />
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
