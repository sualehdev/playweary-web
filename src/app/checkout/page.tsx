import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import { getCatalog } from "@/lib/catalog.server";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";

export const metadata: Metadata = {
  title: "Checkout",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const catalog = await getCatalog();
  return (
    <ShopProvider catalog={catalog}>
      <Checkout />
    </ShopProvider>
  );
}
