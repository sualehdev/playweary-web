"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { money } from "@/content/products";
import { shippingById } from "@/lib/checkout";
import { confetti } from "@/lib/effects";
import { normalizeCode, trackByCode, type TrackedOrder } from "@/lib/orders";
import { trackPurchase } from "@/lib/track";
import { useShop } from "@/store/ShopProvider";
import KitThumb from "./KitThumb";
import OrderLoader from "./OrderLoader";
import "@/styles/promo.css";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

type State = { kind: "loading" } | { kind: "none" } | { kind: "order"; order: TrackedOrder };

/**
 * The page a shopper lands on after placing an order (/thank-you?code=PWT-…).
 * It looks the order up with the private tracking code, so no personal details
 * are shown without a valid code, and fires the `purchase` event once.
 */
export default function ThankYou({ code }: { code?: string }) {
  const { productById } = useShop();
  const valid = code ? normalizeCode(code) : null;
  const [state, setState] = useState<State>(valid ? { kind: "loading" } : { kind: "none" });
  const tick = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!valid) return;
    let live = true;
    trackByCode(valid)
      .then((order) => {
        if (!live) return;
        setState({ kind: "order", order });
        trackPurchase({ ...order, lines: order.lines });
      })
      .catch(() => live && setState({ kind: "none" }));
    return () => {
      live = false;
    };
  }, [valid]);

  const order = state.kind === "order" ? state.order : null;

  useEffect(() => {
    if (order && tick.current) confetti(tick.current, 36);
  }, [order]);

  if (state.kind === "loading") return <OrderLoader title="Getting your receipt ready…" />;

  if (!order) {
    return (
      <div className="coDone card">
        <h1>Thank you!</h1>
        <p className="coLead">
          If you just placed an order, it is safe and a confirmation is on its way to your inbox. You can follow your kit on the Track order page.
        </p>
        <div className="coDoneActions">
          <Link className="btn" href="/track">
            Track an order
          </Link>
          <Link className="btn ghost" href="/">
            Back to Playweary
          </Link>
        </div>
      </div>
    );
  }

  // const itemIds = [...new Set(order.lines.map((l) => l.id))].join(","); // used by the switched-off tracking box below

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
      <h1>Thank you{order.shipTo.firstName ? `, ${order.shipTo.firstName}` : ""}!</h1>
      <p className="coLead">
        We&apos;ve got your order. We&apos;ll confirm it with you shortly, and a receipt is on its way to {order.email}. Keep this number to follow your kit on its
        journey.
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
            {order.shipTo.firstName}
            <br />
            {order.shipTo.city}, {order.shipTo.state}
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
      {/* Order value and item ids box: switched off. The same values are in the page URL
          (?value=…&items=…) and in the `purchase` event, which is what tracking reads.
      <div
        className="coTrack"
        id="pw-order"
        data-order-id={order.number}
        data-order-value={order.total.toFixed(2)}
        data-item-ids={itemIds}
        data-currency="USD"
      >
        <div>
          <span>Order value</span>
          <b>{money(order.total)}</b>
        </div>
        <div>
          <span>Item {order.lines.length === 1 ? "ID" : "IDs"}</span>
          <b>{itemIds.split(",").join(", ")}</b>
        </div>
      </div>
      */}
      <div className="coSummary card">
        <h2 className="coH">Order summary</h2>
        <ul className="coLines">
          {order.lines.map((l) => (
            <li key={l.id + l.size}>
              <KitThumb character={productById(l.id)?.character ?? "boy"} />
              <div className="coLineText">
                <b>{l.name}</b>
                <span>
                  Size {l.size} · Qty {l.q}
                </span>
              </div>
              <b className="coLinePrice">{money(l.lineTotal)}</b>
            </li>
          ))}
        </ul>
        <dl className="coTotals">
          <div>
            <dt>Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping ({shippingById(order.shipping).name})</dt>
            <dd>{order.shippingCost ? money(order.shippingCost) : "Free"}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="coDiscount">
              <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
              <dd>−{money(order.discount)}</dd>
            </div>
          ) : null}
          <div className="coGrand">
            <dt>Total</dt>
            <dd>{money(order.total)}</dd>
          </div>
        </dl>
      </div>
      <Link className="btn ghost" href="/">
        Back to Playweary
      </Link>
    </div>
  );
}
