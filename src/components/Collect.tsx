"use client";

/* eslint-disable @next/next/no-img-element */
import { pieceSize, pieceSrc } from "@/content/art";
import { CHARACTERS, findPiece } from "@/content/characters";
import { useShop } from "@/store/ShopProvider";
import CharacterToggle from "./CharacterToggle";

export default function Collect() {
  const { state, isOwned } = useShop();
  const c = state.character;
  return (
    <section id="collect">
      <div className="wrap">
        <div className="eyebrow">what&apos;s in the box</div>
        <h2>Three sets in every kit</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          Every kit is the shirt plus all three sets for that character, each one a complete look
          in its own small box. No add-ons to chase: everything below arrives together.
        </p>
        <div style={{ marginTop: "1.2rem" }}>
          <CharacterToggle label="Show the collection for" />
        </div>
        <div className="sets" id="setsHost">
          {CHARACTERS[c].sets.map((s) => {
            const owned = isOwned(s.id);
            return (
              <div className="set" key={s.id}>
                <div className="top">
                  <b>{s.name}</b>
                  <span className="ring">
                    {owned ? `${s.pieces.length} pieces ✓` : `${s.pieces.length} pieces`}
                  </span>
                </div>
                <div className="tiles">
                  {s.pieces.map((id) => (
                    <div className={"tile" + (owned ? "" : " locked")} key={id}>
                      <img src={pieceSrc(c, id, 256)} {...pieceSize(c, id, 256)} alt={findPiece(c, id).name} />
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    margin: ".7rem 0 0",
                    fontSize: ".84rem",
                    fontWeight: 700,
                    color: owned ? "#5AA824" : "var(--pink)",
                  }}
                >
                  {owned ? "★ Included in the kit" : "Included in the kit"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
