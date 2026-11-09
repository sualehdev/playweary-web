"use client";

/**
 * "Nine pieces. One Meadow look." — the girl in her Meadow set arrives the way
 * the wardrobe does: in pieces you snap together.
 *
 * The picture is drawn once into <defs> and every tile is a <use> of it clipped
 * to its own outline, so the artwork exists a single time in the DOM no matter
 * how many tiles are on screen. Geometry lives in ./puzzle.
 *
 * Interaction is plain pointer events rather than GSAP Draggable: the tiles snap
 * to fixed homes, so there is nothing to tween, and it keeps this section
 * independent of the Runtime's plugin setup.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { confetti } from "@/lib/effects";
import { BOARD, homeAt, SCRAMBLE, SNAP, TILES, type Tile } from "./puzzle";

const ROW_NAME = ["top", "middle", "bottom"];
const COL_NAME = ["left", "centre", "right"];
const where = (t: Tile) => `${ROW_NAME[t.row]} ${COL_NAME[t.col]}`;

type Drag = { id: number; x: number; y: number; size: number; over: boolean };

const INK = "#200242";
/**
 * The picture: the girl in the full Meadow set, flattened into a single image
 * by `npm run puzzle`, so every tile is a cut of one finished picture.
 */
const PICTURE = "/art/puzzle/meadow-girl.webp";

/** The picture in board coordinates. Drawn once; every tile clips this. */
function PuzzleArt() {
  return (
    <g id="jigArt">
      <image href={PICTURE} x="0" y="0" width={BOARD} height={BOARD} preserveAspectRatio="none" />
    </g>
  );
}

/** One tile's artwork: the picture, clipped to that tile, plus its cut line. */
function TileArt({ tile }: { tile: Tile }) {
  return (
    <svg viewBox={tile.view} className="jigTileSvg" aria-hidden="true">
      <g clipPath={`url(#jigClip${tile.id})`}>
        <use href="#jigArt" />
      </g>
      <path d={tile.d} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

export default function Jigsaw() {
  const [placed, setPlaced] = useState<number[]>([]);
  const [order, setOrder] = useState(SCRAMBLE);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [miss, setMiss] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const done = placed.length === TILES.length;

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    if (done && boardRef.current) confetti(boardRef.current);
  }, [done]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.length = 0;
    };
  }, []);

  /** Is (x, y) — in viewport coordinates — close enough to this tile's home? */
  const atHome = useCallback((id: number, x: number, y: number) => {
    const b = boardRef.current?.getBoundingClientRect();
    if (!b) return false;
    const { fx, fy } = homeAt(TILES[id]);
    return Math.hypot(x - (b.left + fx * b.width), y - (b.top + fy * b.height)) < SNAP * b.width;
  }, []);

  const place = useCallback((id: number) => {
    setPlaced((p) => (p.includes(id) ? p : [...p, id]));
  }, []);

  function onDown(e: React.PointerEvent<HTMLButtonElement>, id: number) {
    const b = boardRef.current?.getBoundingClientRect();
    if (!b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pressRef.current = { x: e.clientX, y: e.clientY, moved: false };
    setDrag({ id, x: e.clientX, y: e.clientY, size: (b.width * TILES[id].size) / 100, over: false });
  }

  function onMove(e: React.PointerEvent<HTMLButtonElement>) {
    const press = pressRef.current;
    if (!drag || !press) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press.moved = true;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: atHome(drag.id, e.clientX, e.clientY) });
  }

  function onUp(e: React.PointerEvent<HTMLButtonElement>) {
    const press = pressRef.current;
    if (!drag) return;
    const { id } = drag;
    setDrag(null);
    pressRef.current = null;
    // A tap — no meaningful travel — places the piece for you. The bench makes
    // the same bargain: dragging is the fun way, tapping is the way that works
    // for a three-year-old and for a keyboard.
    if (!press?.moved || atHome(id, e.clientX, e.clientY)) {
      place(id);
      return;
    }
    setMiss(id);
    later(() => setMiss((m) => (m === id ? null : m)), 420);
  }

  function shuffle() {
    setPlaced([]);
    setDrag(null);
    setOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  function solve() {
    order
      .filter((id) => !placed.includes(id))
      .forEach((id, i) => later(() => place(id), i * 130));
  }

  return (
    <section id="mascot">
      <div className="wrap">
        <div className="eyebrow">meet the Meadow set</div>
        <h2>Nine pieces. One Meadow look.</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          The Meadow set arrives the way the wardrobe does: in pieces. Drag them onto the board,
          or just tap one and it finds its own way home.
        </p>

        <div className="jiggrid">
          <div className="jigStage">
            <div className="lookline">
              <span className="pill" aria-live="polite">
                {placed.length} of {TILES.length} in
              </span>
              <span className="pill light">3 × 3, like the sets</span>
            </div>

            <div
              className={"jigBoard" + (done ? " solved" : "")}
              ref={boardRef}
              role="img"
              aria-label={
                done
                  ? "The Meadow look, fully put together"
                  : `The Meadow look, ${placed.length} of ${TILES.length} pieces in place`
              }
            >
              <svg className="jigGhost" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden="true">
                <defs>
                  <PuzzleArt />
                  {TILES.map((t) => (
                    <clipPath key={t.id} id={`jigClip${t.id}`}>
                      <path d={t.d} />
                    </clipPath>
                  ))}
                </defs>
                <use href="#jigArt" opacity=".16" />
                {TILES.map((t) => (
                  <path
                    key={t.id}
                    d={t.d}
                    fill="none"
                    stroke={INK}
                    strokeWidth="3"
                    strokeDasharray="9 9"
                    opacity={placed.includes(t.id) ? 0 : 0.32}
                  />
                ))}
              </svg>

              {placed.map((id) => (
                <div
                  key={id}
                  className="jigPlaced"
                  style={{
                    left: `${TILES[id].left}%`,
                    top: `${TILES[id].top}%`,
                    width: `${TILES[id].size}%`,
                  }}
                >
                  <TileArt tile={TILES[id]} />
                </div>
              ))}

              {done ? <div className="jigWin">MEADOW LOOK, DONE!</div> : null}
            </div>

            <div className="jigCtas">
              <button className="btn ghost sm" type="button" onClick={shuffle}>
                🎲 Tip the box out again
              </button>
              <button className="btn ghost sm" type="button" onClick={solve} disabled={done}>
                Finish it for me
              </button>
            </div>
          </div>

          <div>
            <div className="tray">
              <div className="trayhead">
                <h3>Loose pieces</h3>
                <em>drag or tap</em>
              </div>
              <div className="jigRack">
                {order.map((id) =>
                  placed.includes(id) ? (
                    <span key={id} className="jigGap" aria-hidden="true" />
                  ) : (
                    <button
                      key={id}
                      type="button"
                      className={
                        "jigTile" + (drag?.id === id ? " lifted" : "") + (miss === id ? " miss" : "")
                      }
                      aria-label={`Puzzle piece, ${where(TILES[id])} of the Meadow look`}
                      onPointerDown={(e) => onDown(e, id)}
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerCancel={() => {
                        setDrag(null);
                        pressRef.current = null;
                      }}
                      // Enter and Space fire click without any pointer event, and
                      // only those arrive with detail 0 — a mouse or touch tap is
                      // already handled above, so this is the keyboard path alone.
                      onClick={(e) => {
                        if (e.detail === 0) place(id);
                      }}
                    >
                      <TileArt tile={TILES[id]} />
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="card jigCard">
              <div style={{ flex: "1 1 200px" }}>
                <h3 style={{ marginBottom: ".2rem" }}>
                  {done ? "That is the whole Meadow set." : "Nine pieces, one character."}
                </h3>
                <p style={{ margin: 0, fontSize: ".9rem" }}>
                  {done
                    ? "Same trick as the shirt: nothing is glued down, so it comes apart and goes back together as often as they like."
                    : "The shirt works the same way: the pieces go on one by one, and the character only turns up once they are all on."}
                </p>
              </div>
              <button className="btn sm" data-scroll="#bench" type="button">
                Shop the kits
              </button>
            </div>
          </div>
        </div>

      </div>

      {drag ? (
        <div
          className={"jigDragging" + (drag.over ? " home" : "")}
          style={{ left: drag.x, top: drag.y, width: drag.size }}
          aria-hidden="true"
        >
          <TileArt tile={TILES[drag.id]} />
        </div>
      ) : null}
    </section>
  );
}
