"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * The checkout: contact, US shipping address, shipping speed and payment
 * (cash on delivery, or PayPal/Venmo/card when the API has PayPal on), with the
 * order summary beside it. Placing the order goes through `placeOrder` in
 * lib/checkout, which sends it to the API; the server's prices and totals are
 * what the confirmation shows.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brandSize, brandSrc } from "@/content/art";
import { money } from "@/content/products";
import { ApiError } from "@/lib/api";
import PaypalCheckout from "./PaypalCheckout";
import {
  US_STATES,
  lookupZip,
  orderSubtotal,
  newIdempotencyKey,
  placeOrder,
  getPaymentsConfig,
  type PaymentsConfig,
  type Order,
  type PlacedOrder,
  shippingById,
  validate,
  validatePromo,
  type Errors,
  type Fields,
  type PaymentMethod,
  type PromoPreview,
  type ShippingMethod,
} from "@/lib/checkout";
import { isEmail } from "@/lib/newsletter";
import { cartCount, type CartLine } from "@/store/shop";
import { useShop } from "@/store/ShopProvider";
import KitThumb from "./KitThumb";
import OrderLoader from "./OrderLoader";
import { Footer } from "./sections";
import "@/styles/promo.css";

const EMPTY: Fields = { email: "", phone: "", firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", zip: "" };
const ORDER: (keyof Fields)[] = ["email", "phone", "firstName", "lastName", "line1", "city", "state", "zip"];

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
  discount = 0,
  promoCode,
  promoBox,
}: {
  shipping: ShippingMethod;
  editable: boolean;
  lines: CartLine[];
  /** Dollars off, from a validated promo code. */
  discount?: number;
  promoCode?: string;
  promoBox?: React.ReactNode;
}) {
  const { setQty, productById } = useShop();
  const subtotal = orderSubtotal(lines, productById);
  const shipCost = shipping.price;
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
              {editable && p.backorder ? <span className="cartMeta backorder">{p.backorderNote || "Backorder: ships a little later"}</span> : null}
            </li>
          );
        })}
      </ul>
      {promoBox}
      <dl className="coTotals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping ({shipping.name})</dt>
          <dd>{shipCost ? money(shipCost) : "Free"}</dd>
        </div>
        {discount > 0 ? (
          <div className="coDiscount">
            <dt>Discount ({promoCode})</dt>
            <dd>−{money(discount)}</dd>
          </div>
        ) : null}
        <div className="coGrand">
          <dt>Total</dt>
          <dd>{money(Math.max(0, subtotal + shipCost - discount))}</dd>
        </div>
      </dl>
      <p className="coSmall">Sales tax, where it applies, is included in the price.</p>
    </div>
  );
}

/** A promo code another part of the site left for the checkout (empty on the server and when none). */
function carriedCode(): string {
  try {
    return (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pw:promo-code")) || "";
  } catch {
    return "";
  }
}

/** "Have a promo code?": the server says what it is worth; placing the order checks it again. */
function PromoBox({
  promo,
  email,
  busy,
  message,
  onApply,
  onRemove,
}: {
  promo: PromoPreview | null;
  email: string;
  busy: boolean;
  message: string;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  // A code carried over from a promo (e.g. the Christmas pop-up) opens the box pre-filled.
  const [code, setCode] = useState(carriedCode);
  const [open, setOpen] = useState(code !== "");
  const emailOk = isEmail(email);
  if (promo) {
    return (
      <div className="coPromo">
        <div className="coPromoChip" role="status">
          <span>
            {promo.code} · {promo.label}
          </span>
          <button type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <div className="coPromo">
        <button type="button" className="coPromoToggle" onClick={() => setOpen(true)}>
          Have a promo code?
        </button>
      </div>
    );
  }
  return (
    <form
      className="coPromo"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (code.trim() && emailOk && !busy) onApply(code.trim());
      }}
    >
      <label htmlFor="co-promo" className="coPromoHint" style={{ fontWeight: 800 }}>
        Promo code
      </label>
      <div className="coPromoRow">
        <input id="co-promo" autoFocus value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Enter code" />
        <button type="submit" disabled={!code.trim() || !emailOk || busy}>
          {busy ? "Checking…" : "Apply"}
        </button>
      </div>
      {!emailOk ? <p className="coPromoHint">Enter your email above first, so we can check the code is yours to use.</p> : null}
      {message ? (
        <p className="coPromoMsg" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}

export default function Checkout({ shippingCents }: { shippingCents: number }) {
  const { state, clear, productById } = useShop();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const shipping: ShippingMethod["id"] = "standard";
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [payCfg, setPayCfg] = useState<PaymentsConfig["paypal"]>({ enabled: false });
  useEffect(() => {
    void getPaymentsConfig().then((c) => setPayCfg(c.paypal));
  }, []);
  const paypalOn = payCfg.enabled && payment === "paypal";
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [placed, setPlaced] = useState(false);
  const [serverError, setServerError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  // One key per attempt: retrying after a network error can't create a second order.
  const attemptKey = useRef<string | null>(null);

  // Standard is the only method; its price is an admin setting passed in from the page.
  const ship: ShippingMethod = { ...shippingById(shipping), price: shippingCents / 100 };
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const total = Math.max(0, orderSubtotal(state.cart, productById) + ship.price - (promo?.discount ?? 0));
  const unavailable = state.cart.filter((l) => productById(l.id)?.available === false);
  const empty = state.hydrated && cartCount(state.cart) === 0;

  const applyPromo = async (code: string) => {
    setPromoBusy(true);
    setPromoMsg("");
    try {
      setPromo(await validatePromo(code, fields.email.trim().toLowerCase(), state.cart));
    } catch (err) {
      setPromoMsg(err instanceof ApiError ? err.message : "Could not check that code. Please try again.");
    } finally {
      setPromoBusy(false);
    }
  };

  // The discount depends on the email and the cart: if either changes, check the code again.
  const cartKey = state.cart.map((l) => `${l.id}:${l.size}:${l.q}`).join("|");
  const emailKey = fields.email.trim().toLowerCase();
  const appliedCode = promo?.code;
  useEffect(() => {
    if (!appliedCode) return;
    let stale = false;
    const t = setTimeout(() => {
      validatePromo(appliedCode, emailKey, state.cart)
        .then((p) => !stale && setPromo(p))
        .catch((err) => {
          if (stale) return;
          setPromo(null);
          setPromoMsg(err instanceof ApiError ? err.message : "Please apply your code again.");
        });
    }, 600);
    return () => {
      stale = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, emailKey, cartKey]);

  useEffect(() => {
    if (placed) top.current?.scrollIntoView({ block: "start" });
  }, [placed]);

  // The state box is a type-to-search field; `fields.state` holds the two-letter code once it matches.
  const [stateText, setStateText] = useState("");
  const [zipNote, setZipNote] = useState("");
  const autofilled = useRef(false);
  const stateName = (code: string) => US_STATES.find(([c]) => c === code)?.[1] ?? "";

  const changeState = (text: string) => {
    setStateText(text);
    const t = text.trim().toLowerCase();
    const hit = US_STATES.find(([code, name]) => name.toLowerCase() === t || code.toLowerCase() === t);
    setFields((f) => ({ ...f, state: hit ? hit[0] : "" }));
    if (errors.state) setErrors((e) => ({ ...e, state: undefined }));
  };

  /** A full ZIP fills in the city and state (only if the shopper has not typed them). */
  const changeZip = (name: keyof Fields, v: string) => {
    change(name, v);
    const zip = v.trim().slice(0, 5);
    if (!/^\d{5}$/.test(zip) || v.trim().length > 5) return;
    void lookupZip(zip).then((hit) => {
      if (!hit) return;
      setFields((f) => {
        const blankCity = !f.city.trim() || autofilled.current;
        const blankState = !f.state || autofilled.current;
        return { ...f, city: blankCity ? hit.city : f.city, state: blankState ? hit.state : f.state };
      });
      setStateText((t) => (autofilled.current || !t.trim() ? stateName(hit.state) : t));
      autofilled.current = true;
      setZipNote(`${hit.city}, ${hit.state}: filled in from your ZIP code. Change it if it is wrong.`);
      setErrors((e) => ({ ...e, city: undefined, state: undefined }));
    });
  };

  const change = (name: keyof Fields, v: string) => {
    if (name === "city") autofilled.current = false;
    if (name === "city") setZipNote("");
    setFields((f) => ({ ...f, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  /** Validate the form; returns the order to send, or null after showing what's wrong. */
  const buildOrder = (method: PaymentMethod): Order | null => {
    const found = validate(fields, isEmail);
    setErrors(found);
    const first = ORDER.find((k) => found[k]);
    if (first) {
      document.getElementById("co-" + first)?.focus();
      return null;
    }
    if (unavailable.length) {
      setServerError(`${productById(unavailable[0].id)?.name ?? "A kit"} isn't available right now. Please remove it to continue.`);
      return null;
    }
    const { email, phone, ...address } = fields;
    return { email, phone, address, shipping, payment: method, lines: state.cart, ...(promo ? { promoCode: promo.code } : {}) };
  };

  // PayPal: one key per distinct order. Same details → same reservation (no duplicates when
  // the PayPal window is closed and reopened); changed details → a fresh key.
  const paypalKey = useRef<{ sig: string; key: string } | null>(null);
  const keyFor = (order: Order) => {
    const sig = JSON.stringify(order);
    if (paypalKey.current?.sig !== sig) paypalKey.current = { sig, key: newIdempotencyKey() };
    return paypalKey.current.key;
  };

  const finish = (order: PlacedOrder) => {
    setPlaced(true);
    clear(); // safe: the "order placed" loader shows while we navigate, not the empty-cart message
    // Value and item ids ride along in the URL too, for tag rules that match on the address.
    const ids = [...new Set(order.lines.map((l) => l.id))].join(",");
    router.push(`/thank-you?code=${encodeURIComponent(order.trackingCode)}&value=${order.total.toFixed(2)}&items=${encodeURIComponent(ids)}`);
  };

  const showError = (message: string, err?: unknown) => {
    if (promo && err instanceof ApiError && err.status === 409 && !err.code) setPromo(null); // the server no longer accepts it
    setServerError(message);
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  const paypalError = (message: string, err?: unknown) => {
    // A rejected or expired checkout (4xx) gets a fresh reservation next time.
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) paypalKey.current = null;
    showError(message, err);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || paypalOn) return;
    const order = buildOrder("cod");
    if (!order) return;
    setBusy(true);
    setServerError("");
    attemptKey.current ??= newIdempotencyKey();
    try {
      const placedOrder = await placeOrder(order, attemptKey.current, honeypot);
      attemptKey.current = null;
      finish(placedOrder);
    } catch (err) {
      // A rejected order (4xx) was not stored, so the next attempt gets a fresh key.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) attemptKey.current = null;
      showError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.", err);
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
          <OrderLoader title="Order placed!" note="Taking you to your receipt…" />
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
                  <div className="coField">
                    <label htmlFor="co-country">Country</label>
                    <input id="co-country" value="United States" readOnly />
                  </div>
                  <div className="coRow">
                    <Field name="firstName" label="First name" autoComplete="given-name" value={fields.firstName} error={errors.firstName} onChange={change} />
                    <Field name="lastName" label="Last name" autoComplete="family-name" value={fields.lastName} error={errors.lastName} onChange={change} />
                  </div>
                  <Field name="line1" label="Street address" autoComplete="address-line1" value={fields.line1} error={errors.line1} onChange={change} />
                  <Field name="line2" label="Apartment, suite, unit" autoComplete="address-line2" optional value={fields.line2} onChange={change} />
                  <div className="coRow three">
                    <Field name="zip" label="ZIP code" autoComplete="postal-code" inputMode="numeric" value={fields.zip} error={errors.zip} onChange={changeZip} />
                    <Field name="city" label="City" autoComplete="address-level2" value={fields.city} error={errors.city} onChange={change} />
                    <div className={"coField" + (errors.state ? " bad" : "")}>
                      <label htmlFor="co-state">State</label>
                      <input
                        id="co-state"
                        name="state"
                        list="co-state-list"
                        autoComplete="address-level1"
                        placeholder="Type to search"
                        value={stateText}
                        aria-invalid={errors.state ? true : undefined}
                        aria-describedby={errors.state ? "co-state-err" : undefined}
                        onChange={(e) => changeState(e.target.value)}
                      />
                      <datalist id="co-state-list">
                        {US_STATES.map(([code, name]) => (
                          <option key={code} value={name} label={code} />
                        ))}
                      </datalist>
                      {errors.state ? (
                        <p className="coErr" id="co-state-err">
                          {errors.state}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {zipNote ? <p className="coHint">{zipNote}</p> : null}
                </fieldset>

                <fieldset className="card">
                  <legend className="coH">Shipping method</legend>
                  <div className="coChoices">
                    <div className="coChoice on">
                      <span className="coChoiceText">
                        <b>{ship.name}</b>
                        <span>
                          {ship.days[0]} to {ship.days[1]} business days
                        </span>
                      </span>
                      <b>{ship.price ? money(ship.price) : "Free"}</b>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="card">
                  <legend className="coH">Payment</legend>
                  <div className="coChoices">
                    <label className={"coChoice" + (payment === "cod" ? " on" : "")}>
                      <input type="radio" name="payment" value="cod" checked={payment === "cod"} onChange={() => { setPayment("cod"); setServerError(""); }} />
                      <span className="coChoiceText">
                        <b>Cash on delivery</b>
                        <span>Pay the courier in cash when your kit arrives.</span>
                      </span>
                      <span className="coPayIcon" aria-hidden="true">
                        💵
                      </span>
                    </label>
                    {payCfg.enabled ? (
                      <label className={"coChoice" + (payment === "paypal" ? " on" : "")}>
                        <input type="radio" name="payment" value="paypal" checked={payment === "paypal"} onChange={() => { setPayment("paypal"); setServerError(""); }} />
                        <span className="coChoiceText">
                          <b>PayPal, Venmo or card</b>
                          <span>Pay now securely with PayPal. No PayPal account needed for cards.</span>
                        </span>
                        <span className="coPayPal" aria-hidden="true">
                          <i>Pay</i>Pal
                        </span>
                      </label>
                    ) : null}
                  </div>
                  {payCfg.enabled && payCfg.env === "sandbox" ? (
                    <p className="coSmall">Test mode: PayPal sandbox. No real money moves.</p>
                  ) : null}
                </fieldset>

                <div className="coHp" aria-hidden="true">
                  {/* Bot trap. Named so browser autofill and password managers leave it alone
                      (a field called "website" gets autofilled and blocks real orders). */}
                  <label htmlFor="co-hp-ref">Leave this empty</label>
                  <input
                    id="co-hp-ref"
                    name="pw_hp_ref"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    data-1p-ignore=""
                    data-lpignore="true"
                    data-bwignore=""
                    data-form-type="other"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                {serverError ? (
                  <p className="coAlert" role="alert" tabIndex={-1} ref={alertRef}>
                    {serverError}
                  </p>
                ) : null}
                {paypalOn && payCfg.enabled ? (
                  <PaypalCheckout
                    clientId={payCfg.clientId}
                    prepare={() => buildOrder("paypal")}
                    idempotencyKey={keyFor}
                    honeypot={honeypot}
                    disabled={busy || unavailable.length > 0}
                    onStart={() => setServerError("")}
                    onPlaced={finish}
                    onError={paypalError}
                  />
                ) : (
                  <button className="btn wide coPlace" type="submit" disabled={busy} aria-busy={busy}>
                    {busy ? "Placing your order…" : `Place order · ${money(total)}`}
                  </button>
                )}
                <p className="coSmall center">
                  {paypalOn ? `You'll pay ${money(total)} in PayPal's secure window.` : "You pay the courier in cash when your kit arrives."} By placing your order you agree to our{" "}
                  <Link href="/returns-refunds">Returns &amp; Refunds Policy</Link>, <Link href="/terms-of-service">Terms of Service</Link> and <Link href="/privacy-policy">Privacy Policy</Link>. Questions? hello@playweary.com
                </p>
              </form>

              <aside className="coAside">
                <Summary
                  shipping={ship}
                  editable
                  lines={state.cart}
                  discount={promo?.discount}
                  promoCode={promo?.code}
                  promoBox={<PromoBox promo={promo} email={fields.email} busy={promoBusy} message={promoMsg} onApply={(c) => void applyPromo(c)} onRemove={() => { setPromo(null); setPromoMsg(""); }} />}
                />
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
