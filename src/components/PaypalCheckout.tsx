"use client";

/**
 * PayPal Smart Buttons (PayPal, Venmo where eligible, and Debit/Credit card; Pay Later off).
 *
 * The browser never decides the amount: `createOrder` asks our API to price and reserve the
 * order and create the PayPal order from its own totals, and `onApprove` asks our API to
 * capture and verify it. Card details are typed into PayPal's own window, never into ours.
 */

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRef } from "react";
import { ApiError } from "@/lib/api";
import { capturePaypalOrder, createPaypalOrder, type Order, type PlacedOrder } from "@/lib/checkout";

type Props = {
  clientId: string;
  /** Validates the form; returns the order to send, or null (and shows the field errors). */
  prepare: () => Order | null;
  /** Same key while the order details stay the same, so retries reuse one reservation. */
  idempotencyKey: (order: Order) => string;
  honeypot: string;
  disabled: boolean;
  onPlaced: (order: PlacedOrder) => void;
  onError: (message: string, err?: unknown) => void;
  onStart: () => void;
};

export default function PaypalCheckout({ clientId, prepare, idempotencyKey, honeypot, disabled, onPlaced, onError, onStart }: Props) {
  // Refs, not locals: the parent re-renders between PayPal's callbacks.
  const pending = useRef<Order | null>(null);
  const reported = useRef(false);
  const fail = (message: string, err?: unknown) => {
    reported.current = true;
    onError(message, err);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
        enableFunding: "venmo",
        disableFunding: "paylater",
        commit: true,
      }}
    >
      <div className="coPaypalButtons">
        <PayPalButtons
          style={{ layout: "vertical", shape: "pill", label: "pay", height: 48 }}
          disabled={disabled}
          forceReRender={[disabled]}
          onClick={(_data, actions) => {
            pending.current = prepare();
            if (!pending.current) return actions.reject();
            reported.current = false;
            onStart();
            return actions.resolve();
          }}
          createOrder={async () => {
            const order = pending.current ?? prepare();
            if (!order) throw new Error("form invalid");
            try {
              return await createPaypalOrder(order, idempotencyKey(order), honeypot);
            } catch (err) {
              fail(err instanceof ApiError ? err.message : "PayPal could not be started. Please try again.", err);
              throw err;
            }
          }}
          onApprove={async (data, actions) => {
            try {
              onPlaced(await capturePaypalOrder(data.orderID));
            } catch (err) {
              // Card declined: let the buyer pick another way to pay in the same PayPal window.
              if (err instanceof ApiError && err.code === "INSTRUMENT_DECLINED") return actions.restart();
              fail(err instanceof ApiError ? err.message : "We couldn't confirm your payment. If you were charged, we'll email your receipt shortly.", err);
            }
          }}
          onCancel={() => fail("Payment cancelled. Your cart is still here whenever you're ready.")}
          onError={() => {
            // Our own message (from createOrder) is more useful than PayPal's generic one.
            if (!reported.current) fail("PayPal ran into a problem. You have not been charged. Please try again or choose cash on delivery.");
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
