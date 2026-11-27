// import Bench from "@/components/Bench";
import ChristmasGiftBand from "@/christmas/ChristmasGiftBand"; // XMAS
import CartDrawer from "@/components/CartDrawer";
import Collect from "@/components/Collect";
import FinalCta from "@/components/FinalCta";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Info from "@/components/Info";
import Jigsaw from "@/components/Jigsaw";
import PageMotion from "@/components/PageMotion";
import KitContents from "@/components/KitContents";
import KitCtas from "@/components/KitCtas";
// import ShirtGallery from "@/components/ShirtGallery"; // now lives on the product pages
import Run from "@/components/Run";
import Show from "@/components/Show";
import Sky from "@/components/Sky";
import Swap from "@/components/Swap";
import { TeeDefs } from "@/components/Tee";
import { Footer, How, Parents, Promo } from "@/components/sections";
import { getCatalog } from "@/lib/catalog.server";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";
import "@/styles/home.css";
import type { Metadata } from "next";

const HOME_TITLE = "Magic Makeover Tees for Kids | Playweary";
const HOME_DESCRIPTION =
  "Discover the Magic Makeover Tee by Playweary. One shirt with Velcro hair and outfits for endless complete looks. No sewing, machine washable, and built to last. Shop now.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: HOME_TITLE, description: HOME_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default async function Page() {
  const catalog = await getCatalog();
  return (
    <ShopProvider catalog={catalog}>
      <Sky />
      <TeeDefs />
      <a className="skip" href="#main">
        Skip to the content
      </a>
      <Promo />
      <Header />
      <CartDrawer />

      <main id="main">
      <Hero />
      <Swap />
      <Show />
      <How />
      {/* <Bench /> drag-and-drop dress-up, switched off: the shirt gallery replaces it */}
      {/* <ShirtGallery /> moved to /products/<kit>; the home page links to it */}
      <KitCtas />
      <KitContents />
      {/* <Shop /> */}
      <Collect />
      <Run />
      <Jigsaw />
      <ChristmasGiftBand /> {/* XMAS */}
      <Parents />
      <Info />
      <FinalCta />
      </main>
      <Footer />

      <PageMotion />
    </ShopProvider>
  );
}
