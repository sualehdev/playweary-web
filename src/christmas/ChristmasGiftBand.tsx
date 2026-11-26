import Link from "next/link";
import Figure from "@/components/Figure";
import { kitId, productById } from "@/content/products";
import { Present, Santa } from "./art";
import Pic from "./Pic";
import { KITS } from "./config";
import "./christmas.css";

const kitLine = (c: "boy" | "girl") => {
  const k = productById(kitId(c));
  return k ? `${k.sub}. ${k.looks}.` : "";
};

/**
 * The Christmas gift list for the home page. A server component, so it is in
 * the first paint and never shifts the page after the scroll effects measure it.
 * Hidden by the layer after the end date, and absent when NEXT_PUBLIC_XMAS=off.
 */
export default function ChristmasGiftBand() {
  if (process.env.NEXT_PUBLIC_XMAS === "off") return null;
  return (
    <section id="xmas-gifts" className="xBand" aria-labelledby="xBandTitle">
      <div className="xBandWrap">
        <div className="xSantaBadge">
          <Pic name="santa" formats={["gif"]} width={288} height={288} fallback={<Santa />} />
        </div>
        <p className="xKicker">
          <Present className="xKickIcon" hue="red" /> The Christmas gift list
        </p>
        <h2 id="xBandTitle">The gift they will actually play with</h2>
        <p className="xBandLede">A shirt and three sets to swap, so one gift turns into 27 different looks.</p>
        <div className="xCards">
          <article className="xCard">
            <div className="xFigBox">
              <span className="xTag">For her</span>
              <Figure character="girl" set={1} className="xFig" />
            </div>
            <h3>Girl Shirt Kit</h3>
            <p>{kitLine("girl")}</p>
            <Link className="btn sm" href={KITS.girl.href}>
              {KITS.girl.label}
            </Link>
          </article>
          <article className="xCard">
            <div className="xFigBox">
              <span className="xTag">For him</span>
              <Figure character="boy" set={2} className="xFig" />
            </div>
            <h3>Boy Shirt Kit</h3>
            <p>{kitLine("boy")}</p>
            <Link className="btn pink sm" href={KITS.boy.href}>
              {KITS.boy.label}
            </Link>
          </article>
          <article className="xCard xWhy">
            <span className="xTag">Why it works as a gift</span>
            <ul>
              <li>Hair, outfits and shoes rip off and stick back on</li>
              <li>No batteries, no screens</li>
              <li>Goes in the same wash</li>
            </ul>
            <Link className="btn ghost sm" href="/#how">
              See how it works
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
