import type { Metadata } from "next";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import Track from "@/components/Track";
import { Promo } from "@/components/sections";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";

export const metadata: Metadata = {
  title: "Track your order",
  alternates: { canonical: "/track" },
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <ShopProvider>
      <Promo />
      <Header />
      <CartDrawer />
      <Track />
    </ShopProvider>
  );
}
