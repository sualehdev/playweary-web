// import Bench from "@/components/Bench";
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
      <Parents />
      <Info />
      <FinalCta />
      </main>
      <Footer />

      <PageMotion />
    </ShopProvider>
  );
}
