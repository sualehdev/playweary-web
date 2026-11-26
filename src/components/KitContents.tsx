"use client";

/* eslint-disable @next/next/no-img-element */
import CharacterToggle from "@/components/CharacterToggle";
import { pieceSize, pieceSrc } from "@/content/art";
import { CHARACTERS, SLOT_LABEL, type SlotType } from "@/content/characters";
import { useShop } from "@/store/ShopProvider";
import "@/styles/shirt.css";

/** Home page: everything that comes in a kit, for the boy or the girl. */
export default function KitContents() {
  const { state } = useShop();
  const c = state.character;
  const def = CHARACTERS[c];
  const groups = def.slots.map((type: SlotType) => ({ type, items: def.pieces.filter((p) => p.type === type) }));
  const pieces = def.pieces.length;
  return (
    <section className="pdBand homeBox" aria-labelledby="kit-box-h">
      <div className="wrap">
        <div className="pdBandHead">
          <span className="eyebrow">What is in the box</span>
          <h2 id="kit-box-h">
            1 shirt, {pieces} velcro pieces, {3 ** def.slots.length} looks
          </h2>
          <p>Every kit has all three sets. Mix any hair with any outfit{c === "girl" ? ", bag" : ""} and shoes, then rip it off and try another.</p>
          <CharacterToggle label="Show the boy or girl kit" />
        </div>
        <div className="pdRows">
          {groups.map((g) => (
            <div className="pdRow" key={g.type}>
              <h3>{SLOT_LABEL[g.type]}</h3>
              <ul>
                {g.items.map((p) => (
                  <li key={p.id}>
                    <img src={pieceSrc(c, p.id, 256)} {...pieceSize(c, p.id, 256)} alt="" loading="lazy" />
                    <span>{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
