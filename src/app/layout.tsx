import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito_Sans } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/content/site";
import "./globals.css";

const display = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const DESCRIPTION =
  "One printed character on the shirt, plus velcro hair, outfits and shoes that rip off and stick back on. Every kit comes with all three sets, and it all goes in the same wash.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · wear. swap. play.`, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · wear. swap. play.`,
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} · wear. swap. play.`, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#FFE8D6",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/brand/logo_light-760.webp` },
    { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
