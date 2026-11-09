import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";

export const metadata: Metadata = {
  title: "Checkout",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <ShopProvider>
      <Checkout />
    </ShopProvider>
  );
}
