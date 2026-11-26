import OrderLoader from "@/components/OrderLoader";

/** Shown the instant the shopper is sent here, while the page itself is being built. */
export default function Loading() {
  return (
    <div className="wrap coMain">
      <OrderLoader title="Getting your receipt ready…" />
    </div>
  );
}
