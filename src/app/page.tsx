import Bench from "@/components/Bench";
import CartDrawer from "@/components/CartDrawer";
import Collect from "@/components/Collect";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Info from "@/components/Info";
import Jigsaw from "@/components/Jigsaw";
import PageMotion from "@/components/PageMotion";
import Run from "@/components/Run";
import Show from "@/components/Show";
import Sky from "@/components/Sky";
import Swap from "@/components/Swap";
import { TeeDefs } from "@/components/Tee";
import { Footer, How, Parents, Promo, Reviews } from "@/components/sections";
import { getCatalog } from "@/lib/catalog.server";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";

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
      <Bench />
      {/* <Shop /> */}
      <Collect />
      <Run />
      <Jigsaw />
      <Reviews />
      <Parents />
      <Info />
      </main>
      <Footer />

      <PageMotion />
    </ShopProvider>
  );
}
