"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The checkout: contact, US shipping address, shipping speed and payment
 * (cash on delivery; PayPal is shown switched off until launch), with the
 * order summary beside it. Placing the order goes through `placeOrder` in
 * lib/checkout, which sends it to the API; the server's prices and totals are
 * what the confirmation shows.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { money } from "@/content/products";
import { ApiError } from "@/lib/api";
import {
  SHIPPING,
  US_STATES,
  orderSubtotal,
  newIdempotencyKey,
  placeOrder,
  shippingById,
  validate,
  type Errors,
  type Fields,
  type PaymentMethod,
  type PlacedLine,
  type PlacedOrder,
  type ShippingMethod,
} from "@/lib/checkout";
import { confetti } from "@/lib/effects";
import { isEmail } from "@/lib/newsletter";
import { cartCount, type CartLine } from "@/store/shop";
import { useShop } from "@/store/ShopProvider";
import KitThumb from "./KitThumb";

const EMPTY: Fields = { email: "", phone: "", firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", zip: "" };
const ORDER: (keyof Fields)[] = ["email", "phone", "firstName", "lastName", "line1", "city", "state", "zip"];

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function Field({
  name,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  optional,
  inputMode,
}: {
  name: keyof Fields;
  label: string;
  value: string;
  error?: string;
  onChange: (name: keyof Fields, v: string) => void;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = "co-" + name;
  return (
    <div className={"coField" + (error ? " bad" : "")}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="coOpt"> (optional)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? id + "-err" : undefined}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {error ? (
        <p className="coErr" id={id + "-err"}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Summary({
  shipping,
  editable,
  lines,
  totals,
}: {
  shipping: ShippingMethod;
  editable: boolean;
  lines: (CartLine | PlacedLine)[];
  /** The server's totals once the order is placed; otherwise a preview from live prices. */
  totals?: { subtotal: number; shipping: number; total: number };
}) {
  const { setQty, productById } = useShop();
  const subtotal = totals?.subtotal ?? orderSubtotal(lines, productById);
  const shipCost = totals?.shipping ?? shipping.price;
  return (
    <div className="coSummary card">
      <h2 className="coH">Order summary</h2>
      <ul className="coLines">
        {lines.map((l) => {
          const p = productById(l.id);
          if (!p) return null;
          return (
            <li key={l.id + l.size}>
              <KitThumb character={p.character ?? "boy"} />
              <div className="coLineText">
                <b>{p.name}</b>
                <span>Size {l.size} · shirt + all 3 sets</span>
                {editable ? (
                  <div className="qty" role="group" aria-label={`Quantity of ${p.name}, size ${l.size}`}>
                    <button type="button" aria-label="One fewer" onClick={() => setQty(l.id, l.size, l.q - 1)}>
                      −
                    </button>
                    <span aria-live="polite">{l.q}</span>
                    <button type="button" aria-label="One more" onClick={() => setQty(l.id, l.size, l.q + 1)}>
                      +
                    </button>
                    <button type="button" className="rm" onClick={() => setQty(l.id, l.size, 0)}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <span>Qty {l.q}</span>
                )}
              </div>
              <b className="coLinePrice">{money("lineTotal" in l ? l.lineTotal : p.price * l.q)}</b>
              {editable && p.backorder ? <span className="cartMeta backorder">{p.backorderNote || "Backorder: ships a little later"}</span> : null}
            </li>
          );
        })}
      </ul>
      <dl className="coTotals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping ({shipping.name})</dt>
          <dd>{shipCost ? money(shipCost) : "Free"}</dd>
        </div>
        <div className="coGrand">
          <dt>Total</dt>
          <dd>{money(totals?.total ?? subtotal + shipCost)}</dd>
        </div>
      </dl>
      <p className="coSmall">Sales tax, where it applies, is included in the price.</p>
    </div>
  );
}

function Confirmation({ order }: { order: PlacedOrder }) {
  const a = order.address;
  const tick = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (tick.current) confetti(tick.current, 36);
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the number is on screen */
    }
  };
  return (
    <div className="coDone card" role="status">
      <div className="coTick" aria-hidden="true" ref={tick}>
        ✓
      </div>
      <h1>Thank you, {a.firstName}!</h1>
      <p className="coLead">
        We&apos;ve got your order. We&apos;ll confirm it with you shortly, and a receipt is on its way to {order.email}. Keep this
        number to follow your kit on its journey.
      </p>
      <div className="coRef">
        <span className="coRefNum">{order.number}</span>
        <button type="button" className="btn ghost sm" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {order.isBackorder ? (
        <p className="buyNote">Something in your order is on backorder, so it may ship a little later than usual. We&apos;ll email you when it&apos;s on its way.</p>
      ) : null}
      <div className="coDoneActions">
        <Link className="btn" href={`/track?code=${order.trackingCode}`}>
          Track this order
        </Link>
      </div>
      <div className="coDoneGrid">
        <div>
          <h3>Arriving</h3>
          <p>
            {day(order.arrives[0])} to {day(order.arrives[1])}
            <br />
            {shippingById(order.shipping).name} shipping
          </p>
        </div>
        <div>
          <h3>Ship to</h3>
          <p>
            {a.firstName} {a.lastName}
            <br />
            {a.line1}
            {a.line2 ? (
              <>
                <br />
                {a.line2}
              </>
            ) : null}
            <br />
            {a.city}, {a.state} {a.zip}
          </p>
        </div>
        <div>
          <h3>Payment</h3>
          <p>
            {order.payment === "cod"
              ? `Cash on delivery: please have ${money(order.total)} ready for the courier.`
              : `Paid with PayPal, ${money(order.total)}.`}
          </p>
        </div>
      </div>
      <Summary
        shipping={shippingById(order.shipping)}
        editable={false}
        lines={order.lines}
        totals={{ subtotal: order.subtotal, shipping: order.shippingCost, total: order.total }}
      />
      <Link className="btn ghost" href="/">
        Back to Playweary
      </Link>
    </div>
  );
}

export default function Checkout() {
  const { state, clear, productById } = useShop();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [shipping, setShipping] = useState<ShippingMethod["id"]>("standard");
  const payment: PaymentMethod = "cod";
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [serverError, setServerError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  // One key per attempt: retrying after a network error can't create a second order.
  const attemptKey = useRef<string | null>(null);

  const ship = shippingById(shipping);
  const total = orderSubtotal(state.cart, productById) + ship.price;
  const unavailable = state.cart.filter((l) => productById(l.id)?.available === false);
  const empty = state.hydrated && cartCount(state.cart) === 0;

  useEffect(() => {
    if (placed) top.current?.scrollIntoView({ block: "start" });
  }, [placed]);

  const change = (name: keyof Fields, v: string) => {
    setFields((f) => ({ ...f, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validate(fields, isEmail);
    setErrors(found);
    const first = ORDER.find((k) => found[k]);
    if (first) {
      document.getElementById("co-" + first)?.focus();
      return;
    }
    if (unavailable.length) {
      setServerError(`${productById(unavailable[0].id)?.name ?? "A kit"} isn't available right now. Please remove it to continue.`);
      return;
    }
    setBusy(true);
    setServerError("");
    attemptKey.current ??= newIdempotencyKey();
    try {
      const { email, phone, ...address } = fields;
      const order = await placeOrder({ email, phone, address, shipping, payment, lines: state.cart }, attemptKey.current, honeypot);
      attemptKey.current = null;
      setPlaced(order);
      clear();
    } catch (err) {
      // A rejected order (4xx) was not stored, so the next attempt gets a fresh key.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) attemptKey.current = null;
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="coPage" ref={top}>
      <header className="coBar">
        <Link href="/" aria-label="Playweary home">
          <img src={brandSrc("logo_light", 380)} {...brandSize("logo_light")} alt="Playweary" className="coLogo" />
        </Link>
        <span className="coSecure">🔒 Secure checkout</span>
        <Link className="coBack" href="/#bench">
          ← Back to shop
        </Link>
      </header>

      <main className="wrap coMain" id="main">
        {placed ? (
          <Confirmation order={placed} />
        ) : !state.hydrated ? null : empty ? (
          <div className="coEmpty card">
            <h1>Your cart is empty</h1>
            <p>Dress a character on the Dress-Up Bench, pick a size and add their kit.</p>
            <Link className="btn" href="/#bench">
              Go to the Dress-Up Bench
            </Link>
          </div>
        ) : (
          <>
            <h1 className="coTitle">Checkout</h1>
            <div className="coGrid">
              <form className="coForm" onSubmit={submit} noValidate>
                <fieldset className="card">
                  <legend className="coH">Contact</legend>
                  <div className="coRow">
                    <Field name="email" label="Email" type="email" autoComplete="email" value={fields.email} error={errors.email} onChange={change} />
                    <Field name="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" value={fields.phone} error={errors.phone} onChange={change} />
                  </div>
                  <p className="coSmall">For your receipt and the courier. Never for marketing unless you sign up.</p>
                </fieldset>

                <fieldset className="card">
                  <legend className="coH">Shipping address</legend>
                  <div className="coRow">
                    <Field name="firstName" label="First name" autoComplete="given-name" value={fields.firstName} error={errors.firstName} onChange={change} />
                    <Field name="lastName" label="Last name" autoComplete="family-name" value={fields.lastName} error={errors.lastName} onChange={change} />
                  </div>
                  <Field name="line1" label="Street address" autoComplete="address-line1" value={fields.line1} error={errors.line1} onChange={change} />
                  <Field name="line2" label="Apartment, suite, unit" autoComplete="address-line2" optional value={fields.line2} onChange={change} />
                  <div className="coRow three">
                    <Field name="city" label="City" autoComplete="address-level2" value={fields.city} error={errors.city} onChange={change} />
                    <div className={"coField" + (errors.state ? " bad" : "")}>
                      <label htmlFor="co-state">State</label>
                      <select
                        id="co-state"
                        name="state"
                        autoComplete="address-level1"
                        value={fields.state}
                        aria-invalid={errors.state ? true : undefined}
                        aria-describedby={errors.state ? "co-state-err" : undefined}
                        onChange={(e) => change("state", e.target.value)}
                      >
                        <option value="">Choose…</option>
                        {US_STATES.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                      {errors.state ? (
                        <p className="coErr" id="co-state-err">
                          {errors.state}
                        </p>
                      ) : null}
                    </div>
                    <Field name="zip" label="ZIP code" autoComplete="postal-code" inputMode="numeric" value={fields.zip} error={errors.zip} onChange={change} />
                  </div>
                  <div className="coField">
                    <label htmlFor="co-country">Country</label>
                    <input id="co-country" value="United States" readOnly />
                  </div>
                </fieldset>

                <fieldset className="card">
                  <legend className="coH">Shipping method</legend>
                  <div className="coChoices">
                    {SHIPPING.map((s) => (
                      <label key={s.id} className={"coChoice" + (shipping === s.id ? " on" : "")}>
                        <input type="radio" name="shipping" value={s.id} checked={shipping === s.id} onChange={() => setShipping(s.id)} />
                        <span className="coChoiceText">
                          <b>{s.name}</b>
                          <span>
                            {s.days[0]} to {s.days[1]} business days
                          </span>
                        </span>
                        <b>{s.price ? money(s.price) : "Free"}</b>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="card">
                  <legend className="coH">Payment</legend>
                  <div className="coChoices">
                    <label className={"coChoice" + (payment === "cod" ? " on" : "")}>
                      <input type="radio" name="payment" value="cod" checked={payment === "cod"} readOnly />
                      <span className="coChoiceText">
                        <b>Cash on delivery</b>
                        <span>Pay the courier in cash when your kit arrives.</span>
                      </span>
                      <span className="coPayIcon" aria-hidden="true">
                        💵
                      </span>
                    </label>
                    <label className="coChoice off" aria-disabled="true">
                      <input type="radio" name="payment" value="paypal" checked={false} disabled readOnly />
                      <span className="coChoiceText">
                        <b>
                          PayPal <em className="coSoon">Live at launch</em>
                        </b>
                        <span>Online payments switch on when the store opens.</span>
                      </span>
                      <span className="coPayPal" aria-hidden="true">
                        <i>Pay</i>Pal
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="coHp" aria-hidden="true">
                  <label htmlFor="co-website">Leave this empty</label>
                  <input id="co-website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>
                {serverError ? (
                  <p className="coAlert" role="alert" tabIndex={-1} ref={alertRef}>
                    {serverError}
                  </p>
                ) : null}
                <button className="btn wide coPlace" type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? "Placing your order…" : `Place order · ${money(total)}`}
                </button>
                <p className="coSmall center">
                  You pay the courier in cash when your kit arrives. By placing your order you agree to our{" "}
                  <Link href="/#info-delivery">30-day returns policy</Link>. Questions? hello@playweary.com
                </p>
              </form>

              <aside className="coAside">
                <Summary shipping={ship} editable lines={state.cart} />
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
