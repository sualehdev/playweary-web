"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * Order tracking: type a reference number, then watch the kit's character walk
 * the parcel along a storybook road, station by station. Prototype data only
 * (see lib/orders).
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { money, productById } from "@/content/products";
import { shippingById } from "@/lib/checkout";
import { confetti } from "@/lib/effects";
import { gsap, reducedMotion } from "@/lib/motion";
import {
  DEMO_REFS,
  LAST_STAGE,
  STAGES,
  getOrder,
  listOrders,
  normalizeRef,
  setSkew,
  skewFor,
  stageAt,
  timeline,
  type TrackedOrder,
} from "@/lib/orders";
import Figure from "./Figure";
import KitThumb from "./KitThumb";

const ROAD = "M70 230 C 190 60, 330 60, 430 170 S 660 290, 780 150 S 910 70, 940 100";
const VIEW = { w: 1000, h: 320 };
const STATION_AT = [0, 0.25, 0.5, 0.75, 1];
const ICONS = ["📝", "🎁", "🚚", "🏠", "🎉"];

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
  const a = order.address;
  return (
    <div className="trOrder card">
      <h3 className="coH">Your order</h3>
      <ul className="coLines">
        {order.lines.map((l) => {
          const p = productById(l.id);
          if (!p) return null;
          return (
            <li key={l.id + l.size}>
              <KitThumb character={p.character ?? "boy"} />
              <div className="coLineText">
                <b>{p.name}</b>
                <span>
                  Size {l.size} · Qty {l.q}
                </span>
              </div>
              <b className="coLinePrice">{money(p.price * l.q)}</b>
            </li>
          );
        })}
      </ul>
      <dl className="trFacts">
        <div>
          <dt>Ship to</dt>
          <dd>
            {a.firstName} {a.lastName}, {a.line1}, {a.city}, {a.state} {a.zip}
          </dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {shippingById(order.shipping).name} · {day(order.arrives[0])} to {day(order.arrives[1])}
          </dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>Cash on delivery · {money(order.total)} due</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Track() {
  const [input, setInput] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [missing, setMissing] = useState("");
  const [reached, setReached] = useState(0);
  const [picked, setPicked] = useState(0);
  const [recent, setRecent] = useState<TrackedOrder[]>([]);
  const [copied, setCopied] = useState(false);
  const status = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = useCallback((raw: string) => {
    const ref = normalizeRef(raw);
    const found = ref ? getOrder(ref) : null;
    if (!found) {
      setOrder(null);
      setMissing(raw.trim() || "that");
      return;
    }
    setMissing("");
    setOrder(found);
    const idx = stageAt(found);
    setReached(idx);
    setPicked(idx);
    setInput(found.number);
    window.history.replaceState(null, "", `/track?ref=${found.number}`);
    requestAnimationFrame(() => status.current?.focus());
  }, []);

  useEffect(() => {
    // Deferred a tick: storage and the URL only exist in the browser.
    const t = setTimeout(() => {
      setRecent(listOrders());
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) lookup(ref);
    }, 0);
    return () => clearTimeout(t);
  }, [lookup]);

  // Real orders drift forward with the clock.
  useEffect(() => {
    if (!order || order.frozen !== undefined) return;
    const t = setInterval(() => {
      const idx = stageAt(order);
      setReached((r) => {
        if (idx > r) setPicked(idx);
        return Math.max(r, idx);
      });
    }, 5000);
    return () => clearInterval(t);
  }, [order]);

  const next = () => {
    if (!order || reached >= LAST_STAGE) return;
    const idx = reached + 1;
    if (!order.demo) setSkew(order.number, skewFor(order, idx));
    setReached(idx);
    setPicked(idx);
  };

  const restart = () => {
    if (!order) return;
    if (!order.demo) setSkew(order.number, skewFor(order, 0) - 1);
    setReached(0);
    setPicked(0);
  };

  const events = order ? timeline(order, reached) : [];
  const ev = events[picked];

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
      <header className="coBar">
        <Link href="/" aria-label="Playweary home">
          <img src={brandSrc("logo_light", 380)} {...brandSize("logo_light")} alt="Playweary" className="coLogo" />
        </Link>
        <span className="coSecure">📦 Order tracker</span>
        <Link className="coBack" href="/">
          ← Back to Playweary
        </Link>
      </header>

      <main className="wrap coMain" id="main">
        <p className="eyebrow">Where&apos;s my kit?</p>
        <h1 className="coTitle">Track your order</h1>

        <form
          className="trLookup card"
          onSubmit={(e) => {
            e.preventDefault();
            lookup(input);
          }}
        >
          <label htmlFor="tr-ref">Reference number</label>
          <div className="trLookupRow">
            <input
              id="tr-ref"
              ref={inputRef}
              value={input}
              placeholder="PW-123456"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={missing ? true : undefined}
              aria-describedby={missing ? "tr-err" : "tr-help"}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn" type="submit">
              Track
            </button>
          </div>
          {missing ? (
            <p className="coErr" id="tr-err" role="alert">
              Hmm, Pip can&apos;t find an order for &ldquo;{missing}&rdquo;. A reference looks like PW-123456. Check your confirmation and try again.
            </p>
          ) : (
            <p className="coSmall" id="tr-help">
              Find it on your order confirmation. No order yet? Try a demo number:
            </p>
          )}
          <div className="trChips">
            {DEMO_REFS.map((r) => (
              <button key={r} type="button" className="trChip" onClick={() => lookup(r)}>
                {r}
              </button>
            ))}
            {recent.slice(0, 3).map((o) => (
              <button key={o.number} type="button" className="trChip mine" onClick={() => lookup(o.number)}>
                {o.number} · yours
              </button>
            ))}
          </div>
        </form>

        {order && ev ? (
          <section className="trResult" aria-label={`Tracking for ${order.number}`}>
            <div className="trHead">
              <div>
                <h2 tabIndex={-1} ref={status}>
                  {order.number}
                  {order.demo ? <em className="coSoon">Demo</em> : null}
                </h2>
                <p className="trNow" aria-live="polite">
                  <b>{STAGES[reached].label}.</b> {STAGES[reached].blurb}
                </p>
              </div>
              <button type="button" className="btn ghost sm" onClick={copy}>
                {copied ? "Copied!" : "Copy number"}
              </button>
            </div>

            <Journey order={order} reached={reached} picked={picked} onPick={setPicked} />

            <div className="trCols">
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
                          <span>{e.done ? when(e.time) : "Coming up"}</span>
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
              <OrderCard order={order} />
            </div>

            <div className="trDemo card">
              <p>
                <b>Prototype controls.</b> Real orders move on their own every few minutes. Skip ahead to see every stage.
              </p>
              <div className="trDemoBtns">
                <button type="button" className="btn sm" onClick={next} disabled={reached >= LAST_STAGE}>
                  Next stage
                </button>
                <button type="button" className="btn ghost sm" onClick={restart}>
                  Start over
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
