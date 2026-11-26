import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import PageShell from "@/components/PageShell";
import ShirtGallery from "@/components/ShirtGallery";
import { getShipping } from "@/lib/settings.server";
import { shipPrice } from "@/lib/settings";
import { pieceSize, pieceSrc } from "@/content/art";
import { SLOT_LABEL, type SlotType } from "@/content/characters";
import { PRODUCTS, SIZES, money, productById } from "@/content/products";
import {
  PRODUCT_FACTS,
  PRODUCT_PAGES,
  BRAND,
  describe,
  kitPieces,
  productImages,
  productPageBySlug,
  productPath,
} from "@/content/productPages";
import { SITE_URL } from "@/content/site";
import { SHIRT_SIZE, shirtSrc } from "@/content/shirts";
import { SHIPPING } from "@/lib/checkout";
import { applyCatalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog.server";

/** Only the two kit pages exist; anything else under /products is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = productPageBySlug(slug);
  if (!page) return {};
  const kit = productById(`kit-${page.character}`)!;
  const image = shirtSrc(productImages(page.character)[0], 1100);
  return {
    title: kit.name,
    description: describe(page.character),
    alternates: { canonical: `/products/${page.slug}` },
    openGraph: { type: "website", title: kit.name, description: describe(page.character), url: `/products/${page.slug}`, images: [image] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const page = productPageBySlug(slug);
  if (!page) notFound();

  const catalog = await getCatalog();
  const kit = applyCatalog(PRODUCTS, catalog).find((p) => p.character === page.character)!;
  const [standard] = SHIPPING;
  const shipCents = (await getShipping()).standardCents;
  const other = PRODUCT_PAGES.find((p) => p.character !== page.character)!;
  const otherKit = applyCatalog(PRODUCTS, catalog).find((p) => p.character === other.character)!;
  const all = kitPieces(page.character);
  const pieces = all;
  const looks = kit.looks?.match(/\d+/)?.[0] ?? "27";
  const groups = Array.from(new Set(all.map((p) => p.type))).map((type) => ({ type: type as SlotType, items: all.filter((p) => p.type === type) }));
  const specs = ([
    ["Fabric", PRODUCT_FACTS.fabric],
    ["Fibre content", PRODUCT_FACTS.fibre],
  ] as const);
  const url = `${SITE_URL}/products/${page.slug}`;
  const availability =
    kit.available === false ? "https://schema.org/OutOfStock" : kit.backorder ? "https://schema.org/BackOrder" : "https://schema.org/InStock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: kit.name,
    description: describe(page.character),
    sku: kit.id,
    mpn: kit.id,
    brand: { "@type": "Brand", name: BRAND },
    image: productImages(page.character).map((id) => `${SITE_URL}${shirtSrc(id, 1100)}`),
    audience: { "@type": "PeopleAudience", suggestedGender: page.character === "boy" ? "male" : "female", suggestedMinAge: 3 },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: kit.price.toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: (shipCents / 100).toFixed(2), currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: { "@type": "QuantitativeValue", minValue: standard.days[0], maxValue: standard.days[1], unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnFees: "https://schema.org/FreeReturn",
        merchantReturnLink: `${SITE_URL}/returns-refunds`,
      },
    },
  };

  return (
    <PageShell>
      <ShirtGallery character={page.character} heading="h1" shippingCents={shipCents} />

      <ul className="pdTrust wrap" aria-label="Key facts">
        <li>
          <b>Ages 3+</b>
          <span>Sized 2T to 8 by height</span>
        </li>
        <li>
          <b>220 GSM cotton</b>
          <span>Combed, stitched patches</span>
        </li>
        <li>
          <b>Machine washable</b>
          <span>Cold, inside out</span>
        </li>
        <li>
          <b>Rip off, stick on</b>
          <span>Velcro that lasts</span>
        </li>
      </ul>

      <section className="pdBand" aria-labelledby="pd-how">
        <div className="wrap">
          <div className="pdBandHead">
            <span className="eyebrow">What is in the box</span>
            <h2 id="pd-how">1 shirt, {pieces.length} velcro pieces, {looks} looks</h2>
            <p>
              Every kit has all three sets. Mix any hair with any outfit{page.character === "girl" ? ", bag" : ""} and shoes, then rip it off and try another.
            </p>
          </div>
          <div className="pdRows">
            {groups.map((g) => (
              <div className="pdRow" key={g.type}>
                <h3>{SLOT_LABEL[g.type]}</h3>
                <ul>
                  {g.items.map((p) => (
                    <li key={p.id}>
                      <img src={pieceSrc(page.character, p.id, 256)} {...pieceSize(page.character, p.id, 256)} alt="" loading="lazy" />
                      <span>{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap pdDetails" aria-label="Product details">
        <div className="pdSizes" id="sizes">
          <h2>Find the right size</h2>
          <p>Pick by your child&apos;s height. Between sizes? Go up one.</p>
          <table>
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Height</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((sz) => (
                <tr key={sz.id}>
                  <th scope="row">{sz.id}</th>
                  <td>
                    {sz.inches} <small>({sz.cm})</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pdAcc">
          <details open>
            <summary>About this kit</summary>
            <p>{describe(page.character)}</p>
          </details>
          <details>
            <summary>Materials and care</summary>
            <dl className="prodSpecs">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div>
                <dt>Care</dt>
                <dd>
                  Machine wash cold, inside out. Tumble dry low or hang to dry. Do not bleach.
                </dd>
              </div>
            </dl>
          </details>
          <details>
            <summary>Shipping</summary>
            <p>
              {standard.name} US shipping is <b>{shipPrice(shipCents).toLowerCase()}</b> and takes {standard.days[0]} to {standard.days[1]} business days. Orders before 2 pm ET usually leave the same day.{" "}
              <Link href="/shipping-policy">Shipping Policy</Link>
            </p>
          </details>
          <details>
            <summary>Returns</summary>
            <p>
              <b>30-day returns</b> on unworn shirts and unopened sets. Return shipping is free, and refunds are processed within 3 to 5 business days of us receiving the parcel. <Link href="/returns-refunds">Returns &amp; Refunds</Link>
            </p>
          </details>
        </div>
      </section>

      <div className="wrap">
        <p className="prodWarn" role="note">
          <b>WARNING: CHOKING HAZARD.</b> Small parts. Not for children under 3 years. {PRODUCT_FACTS.age}. Keep loose pieces away from babies and younger siblings.
        </p>
      </div>

      <section className={"pdMore " + other.character} aria-labelledby="pd-more">
        <div className="wrap">
          <Link href={productPath(other.character)} className="pdMoreCard" aria-label={`See the ${otherKit.name}`}>
            <span className="pdMoreMedia">
              <img src={shirtSrc(productImages(other.character)[0], 1100)} width={SHIRT_SIZE[other.character].w} height={SHIRT_SIZE[other.character].h} alt="" loading="lazy" />
              <span className="pdMoreBadge">{other.character === "boy" ? "For boys" : "For girls"}</span>
            </span>
            <span className="pdMoreBody">
              <span className="eyebrow">Shopping for a sibling?</span>
              <h2 id="pd-more">{otherKit.name}</h2>
              <span className="pdMorePrice">{money(otherKit.price)}</span>
              <span className="pdMoreText">{otherKit.sub}. {otherKit.looks}.</span>
              <span className="pdMoreThumbs" aria-hidden="true">
                {productImages(other.character).map((id) => (
                  <img key={id} src={shirtSrc(id, 640)} width={SHIRT_SIZE[other.character].w} height={SHIRT_SIZE[other.character].h} alt="" loading="lazy" />
                ))}
              </span>
              <span className="pdMoreChips">
                <span>All 3 sets included</span>
                <span>Standard shipping {shipPrice(shipCents)}</span>
                <span>30-day returns</span>
              </span>
              <span className="btn pdMoreBtn">
                See the {other.character === "boy" ? "boys" : "girls"} kit <span aria-hidden="true">→</span>
              </span>
            </span>
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  );
}
