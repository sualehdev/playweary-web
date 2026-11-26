/* eslint-disable @next/next/no-img-element */
/* The sections that are only words: server-rendered, no JavaScript. */

import { brandSize, brandSrc, decorSrc } from "@/content/art";
import Link from "next/link";
import { BUSINESS } from "@/content/business";
import { POLICY_BY_SLUG } from "@/content/policies";
import { getPromo } from "@/lib/settings.server";
import { promoLoop } from "@/lib/settings";
import CookieSettingsLink from "./CookieSettingsLink";

/** Decoration from the layout PDF. Always hidden from assistive tech. */
export function Decor({ name, className }: { name: Parameters<typeof decorSrc>[0]; className: string }) {
  return <img className={"decor " + className} src={decorSrc(name)} alt="" aria-hidden="true" />;
}

/** The top bar: messages that scroll in a loop. Text, speed and direction come from the admin dashboard. */
export async function Promo() {
  const promo = await getPromo();
  if (!promo.enabled) return <style>{"header.bar{top:0!important}"}</style>;
  const { reps, seconds } = promoLoop(promo);
  const set = Array.from({ length: reps }, () => promo.messages).flat();
  return (
    <div id="promo" role="region" aria-label="Announcements" data-dir={promo.direction}>
      <div className="promoTrack" style={{ ["--promo-dur" as string]: `${seconds}s` }}>
        <ul className="promoSet">
          {set.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
        <ul className="promoSet" aria-hidden="true">
          {set.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function How() {
  return (
    <section id="how">
      <div className="wrap">
        <div className="eyebrow">three moves, no scissors</div>
        <h2>Rip. Stick. Play.</h2>
        <Decor name="loop-arrow" className="dLoop" />
        <div className="steps">
          <div className="card step s1">
            <Decor name="squiggle-green-lg" className="dStep" />
            <b>1</b>
            <h3>Rip</h3>
            <p style={{ margin: ".3rem 0 0", fontSize: ".95rem" }}>
              Yesterday&apos;s outfit comes off in one pull. No sewing, no asking a grown-up.
            </p>
          </div>
          <div className="card step s2">
            <Decor name="dots-pink-lg" className="dStep" />
            <b>2</b>
            <h3>Stick</h3>
            <p style={{ margin: ".3rem 0 0", fontSize: ".95rem" }}>
              Press it down and the loop field grabs. We yanked one 200 times and it held.
            </p>
          </div>
          <div className="card step s3">
            <Decor name="squiggle-yellow-sm" className="dStep" />
            <b>3</b>
            <h3>Play</h3>
            <p style={{ margin: ".3rem 0 0", fontSize: ".95rem" }}>
              Then go be a scout until dinner. Machine wash cold, pieces on or off.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Parents() {
  return (
    <section id="parents">
      <div className="wrap">
        <div className="eyebrow">the quiet section</div>
        <h2>The boring bit. It&apos;s the good bit.</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          Notice the volume drop. Nothing performs here: this is where a parent gets evidence.
        </p>
        <div className="pgrid">
          <div className="card">
            <div className="spec">14 × 17.7</div>
            <h3>The shirt, in inches</h3>
            <p style={{ fontSize: ".93rem", margin: 0 }}>
              Size 5: chest 14 in flat, body 17.7 in, print area 8.7 × 11 in, about a sheet of letter paper.
            </p>
          </div>
          <div className="card">
            <div className="spec">40×</div>
            <h3>The wash test, filmed</h3>
            <p style={{ fontSize: ".93rem", margin: 0 }}>
              Forty washes, photographed every tenth. We show you the faded one.
            </p>
          </div>
          <div className="card">
            <div className="spec">3+</div>
            <h3>Made for ages 3 and up</h3>
            <p style={{ fontSize: ".93rem", margin: 0 }}>
              The pieces are small, so keep loose ones away from babies and younger siblings. The
              choking-hazard warning is on every product page.
            </p>
          </div>
          <div className="card">
            <div className="spec">1 = 27</div>
            <h3>The cost maths</h3>
            <p style={{ fontSize: ".93rem", margin: 0 }}>
              One $40 kit against twenty-seven printed tees. That is under $1.50 a look.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/products/boy-shirt-kit", label: "Boys Shirt Kit" },
      { href: "/products/girl-shirt-kit", label: "Girls Shirt Kit" },
      { href: "/track", label: "Track your order" },
    ],
  },
  {
    title: "Help",
    links: ["shipping-policy", "returns-refunds", "payment-policy", "faq", "contact"].map((slug) => ({ href: "/" + slug, label: POLICY_BY_SLUG[slug].link })),
  },
  {
    title: "Company",
    links: ["about", "privacy-policy", "terms-of-service", "cookie-policy"].map((slug) => ({
      href: "/" + slug,
      label: POLICY_BY_SLUG[slug].link,
    })),
  },
];

function SocialIcon({ name }: { name: "Facebook" | "Instagram" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="currentColor">
      {name === "Facebook" ? (
        <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
      ) : (
        <path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21.9 8.2c-.1-1.6-.4-3-1.6-4.2S17.4 2.5 15.8 2.4C14.2 2.3 9.8 2.3 8.2 2.4 6.6 2.5 5.2 2.8 4 4S2.5 6.6 2.4 8.2c-.1 1.6-.1 6 0 7.6.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6 .1 7.6 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6 0-7.6zm-2 9.4a3.1 3.1 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3.1 3.1 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3.1 3.1 0 0 1 5.6 5.3C6.8 4.8 9.6 4.9 11 4.9s4.1-.1 5.3.4a3.1 3.1 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3z" />
      )}
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="f">
      <div className="wrap">
        <div className="fCols">
          <div className="fBrand">
            <img src={brandSrc("logo_dark", 380)} {...brandSize("logo_dark")} alt="Playweary" />
            <p>Kids&apos; shirts with velcro hair, outfits and shoes that rip off and stick back on.</p>
            <address>
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </address>
            <ul className="fSocial" aria-label="Follow Playweary">
              {BUSINESS.social.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.name} (opens in a new tab)`}>
                    <SocialIcon name={s.name} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {FOOTER_GROUPS.map((g) => (
            <nav key={g.title} aria-label={g.title} className="fGroup">
              <h3>{g.title}</h3>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
              {g.title === "Company" ? <CookieSettingsLink /> : null}
            </nav>
          ))}
        </div>
        <p className="fine">© 2026 {BUSINESS.brand} · Emails are for grown-ups only</p>
      </div>
    </footer>
  );
}
