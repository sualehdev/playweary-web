"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The checkout: contact, US shipping address, shipping speed and payment
 * (cash on delivery; PayPal is shown switched off until launch), with the
 * order summary beside it. Placing the order goes through `placeOrder` in
 * lib/checkout, the only place that will talk to a server.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { money, productById } from "@/content/products";
import {
  SHIPPING,
  US_STATES,
  orderSubtotal,
  placeOrder,
  shippingById,
  validate,
  type Errors,
  type Fields,
  type PaymentMethod,
  type PlacedOrder,
  type ShippingMethod,
} from "@/lib/checkout";
import { confetti } from "@/lib/effects";
import { isEmail } from "@/lib/newsletter";
import { cartCount } from "@/store/shop";
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
}: {
  shipping: ShippingMethod;
  editable: boolean;
  lines: PlacedOrder["lines"];
}) {
  const { setQty } = useShop();
  const subtotal = orderSubtotal(lines);
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
              <b className="coLinePrice">{money(p.price * l.q)}</b>
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
          <dd>{shipping.price ? money(shipping.price) : "Free"}</dd>
        </div>
        <div className="coGrand">
          <dt>Total</dt>
          <dd>{money(subtotal + shipping.price)}</dd>
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
      <p className="coLead">Your order is confirmed. Keep this reference number to follow your kit on its journey.</p>
      <div className="coRef">
        <span className="coRefNum">{order.number}</span>
        <button type="button" className="btn ghost sm" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="coSmall">This is a prototype order: no payment was taken and no email is sent.</p>
      <div className="coDoneActions">
        <Link className="btn" href={`/track?ref=${order.number}`}>
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
      <Summary shipping={shippingById(order.shipping)} editable={false} lines={order.lines} />
      <Link className="btn ghost" href="/">
        Back to Playweary
      </Link>
    </div>
  );
}

export default function Checkout() {
  const { state, clear } = useShop();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [shipping, setShipping] = useState<ShippingMethod["id"]>("standard");
  const payment: PaymentMethod = "cod";
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const ship = shippingById(shipping);
  const total = orderSubtotal(state.cart) + ship.price;
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
    setBusy(true);
    try {
      const { email, phone, ...address } = fields;
      const order = await placeOrder({ email, phone, address, shipping, payment, lines: state.cart });
      setPlaced(order);
      clear();
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
        <span className="coSecure">🔒 Demo checkout</span>
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

                <button className="btn wide coPlace" type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? "Placing your order…" : `Place order · ${money(total)}`}
                </button>
                <p className="coSmall center">
                  Prototype checkout: no real payment is taken. By placing your order you agree to our{" "}
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
