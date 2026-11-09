/* eslint-disable @next/next/no-img-element */
import { PRINT, baseArt, baseSrc, pieceArt, pieceSize, pieceSrc, type CharacterId } from "@/content/art";
import { CHARACTERS } from "@/content/characters";

const Z = { outfit: 2, shoes: 3, hair: 4, bag: 5 } as const;

/**
 * A standing character in a set, drawn in the same print coordinates as the
 * bench, so the pieces sit exactly where they do on the shirt. The print box
 * has empty margin above and below the figure; negative margins take it back.
 */
export default function Figure({
  character,
  set,
  className,
}: {
  character: CharacterId;
  /** 1–3: which set's pieces they are wearing. */
  set: 1 | 2 | 3;
  className?: string;
}) {
  const base = baseArt(character);
  const charH = ((PRINT.charBottom - PRINT.charTop) / 100) * PRINT.h;
  const charWPct = ((charH * base.w) / base.h / PRINT.w) * 100;
  const pieces = CHARACTERS[character].slots.map((slot) => `${slot}${set}`);
  return (
    <div className={"figure" + (className ? " " + className : "")} style={{ aspectRatio: `${PRINT.w} / ${PRINT.h}` }}>
      <img
        className="figureBase"
        src={baseSrc(character, 1280, true)}
        width={base.w}
        height={base.h}
        alt=""
        style={{
          left: PRINT.cx - charWPct / 2 + "%",
          top: PRINT.charTop + "%",
          width: charWPct + "%",
        }}
      />
      {pieces.map((id) => {
        const art = pieceArt(character, id);
        return (
          <img
            key={id}
            className="figurePiece"
            src={pieceSrc(character, id, 640)}
            {...pieceSize(character, id, 640)}
            alt=""
            style={{ left: art.slot.cx + "%", top: art.slot.cy + "%", width: art.slot.w + "%", zIndex: Z[art.type] }}
          />
        );
      })}
    </div>
  );
}
