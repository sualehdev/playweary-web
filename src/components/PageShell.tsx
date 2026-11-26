import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import { Footer, Promo } from "@/components/sections";
import { getCatalog } from "@/lib/catalog.server";
import { ShopProvider } from "@/store/ShopProvider";
import "@/styles/playweary.css";
/** Promo bar, header, basket and the full footer around a standalone page. */
export default async function PageShell({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <ShopProvider catalog={catalog}>
      <Promo />
      <Header />
      <CartDrawer />
      <main id="main" className="pageMain">{children}</main>
      <Footer />
    </ShopProvider>
  );
}
