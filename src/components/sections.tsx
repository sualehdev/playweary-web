/* eslint-disable @next/next/no-img-element */
/* The sections that are only words: server-rendered, no JavaScript. */

import { brandSize, brandSrc, decorSrc } from "@/content/art";
import { INFO } from "@/content/info";
import Newsletter from "./Newsletter";

/** Decoration from the layout PDF. Always hidden from assistive tech. */
export function Decor({ name, className }: { name: Parameters<typeof decorSrc>[0]; className: string }) {
  return <img className={"decor " + className} src={decorSrc(name)} alt="" aria-hidden="true" />;
}

const Quote = ({ colour }: { colour: string }) => (
  <svg className="quote" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 6C17 6 6 17 6 32v22a4 4 0 0 0 4 4h22c15 0 26-11 26-26S47 6 32 6Z" fill={colour} />
    <path d="M24 24c-4 2-7 6-7 11 0 4 3 7 6 7s6-3 6-6-2-5-5-5c0-3 2-5 4-6Zm18 0c-4 2-7 6-7 11 0 4 3 7 6 7s6-3 6-6-2-5-5-5c0-3 2-5 4-6Z" fill="#fff" />
  </svg>
);

export function Promo() {
  return (
    <div id="promo">
      <b>Free US shipping</b> on every kit · 30-day returns
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

export function Reviews() {
  return (
    <section id="reviews">
      <div className="wrap">
        <div className="eyebrow">what parents say</div>
        <h2>Bought once. Worn everywhere.</h2>
        <Decor name="confetti" className="dConfetti" />
        <div className="revs">
          <div className="card rev">
            <Quote colour="#9F3EFF" />
            <div className="stars">★★★★★</div>
            <p>
              &quot;He changes it three times before school. One shirt, so I&apos;m still doing one
              wash.&quot;
            </p>
            <cite>Jessica M., mom of two · Austin, TX</cite>
          </div>
          <div className="card rev">
            <Quote colour="#81DF40" />
            <div className="stars">★★★★★</div>
            <p>
              &quot;The pieces have survived a term and a half. I expected them in the bin by
              October.&quot;
            </p>
            <cite>Daniel R., dad of a 5-year-old · Columbus, OH</cite>
          </div>
          <div className="card rev">
            <Quote colour="#FF2D60" />
            <div className="stars">★★★★☆</div>
            <p>
              &quot;Sizing chart is by height, which is the first time that&apos;s been
              useful.&quot;
            </p>
            <cite>Priya S., mom of twins · San Jose, CA</cite>
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
            <div className="spec">3 Qs</div>
            <h3>The velcro answers</h3>
            <p style={{ fontSize: ".93rem", margin: 0 }}>
              Does it scratch? Catch hair? Is a loose piece a choke risk for a baby sibling? Answered
              in writing, unprompted. <a href="#info-safety">Read the Safety page.</a>
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

export function Footer() {
  return (
    <footer className="f">
      <div className="wrap">
        <img src={brandSrc("logo_dark", 380)} {...brandSize("logo_dark")} alt="Playweary" />
        <h2>Played till weary.</h2>
        <p style={{ opacity: 0.82, marginTop: ".6rem" }}>
          We&apos;ll write when a new set lands. About once a month, never more.
        </p>
        <Newsletter />
        <nav className="flinks" aria-label="Information">
          {INFO.map((e) => (
            <a key={e.id} href={"#info-" + e.id}>
              {e.title}
            </a>
          ))}
        </nav>
        <p className="fine">© 2026 Playweary · hello@playweary.com · emails are for grown-ups only</p>
      </div>
    </footer>
  );
}
