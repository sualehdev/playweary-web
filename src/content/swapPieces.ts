/**
 * The pieces that burst out of the blob in "The swap".
 *
 * The baked frames hold Pip, the blob and the bursts; the pieces are drawn on
 * top, live, so they can be the real ones and can change every time the
 * section replays. Everything here is pure maths in the frames' own design
 * space (1600 x 1000), so it can be tested without a canvas.
 */

import { CHARACTERS, type CharacterId } from "./characters";

/** The size the baked frames were drawn in. */
export const DESIGN_W = 1600;
export const DESIGN_H = 1000;

/** Where the blob stood, where the ground is, and where the rack builds. */
const FOE_X = 1080;
const GROUND = 800;
const RACK_X = 1080;
const RACK_Y = 440;
const RACK_STEP_X = 150;
const RACK_STEP_Y = 170;

/** A piece is drawn to fit a square this big (design px) at scale 1. */
export const PIECE_BOX = 150;

export type SetNo = 1 | 2 | 3;
export type Look = { boy: SetNo; girl: SetNo };
export type FlyPiece = { character: CharacterId; id: string };

/** One boy set and one girl set, each of the three at random. */
export function rollLook(random: () => number = Math.random): Look {
  const pick = () => (1 + Math.floor(random() * 3)) as SetNo;
  return { boy: pick(), girl: pick() };
}

/** The boy's three pieces, then the girl's four. */
export function piecesFor(look: Look): FlyPiece[] {
  return (["boy", "girl"] as const).flatMap((character) =>
    CHARACTERS[character].slots.map((slot) => ({ character, id: `${slot}${look[character]}` }))
  );
}

/** How many pieces in each rack row: [boy, girl]. */
export const RACK_ROWS = [CHARACTERS.boy.slots.length, CHARACTERS.girl.slots.length];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const rad = (deg: number) => (deg * Math.PI) / 180;

export type Placed = {
  /** Index into `piecesFor(look)`. */
  i: number;
  x: number;
  y: number;
  /** Degrees. */
  rotate: number;
  scale: number;
  /** A streak behind a piece that is still travelling fast. */
  streak: { x0: number; y0: number; x1: number; y1: number; width: number; alpha: number } | null;
};

/** Where the rack slot for piece `i` is: boy row on top, girl row below. */
export function rackSlot(i: number, rows: number[]) {
  const row = i < rows[0] ? 0 : 1;
  const col = row === 0 ? i : i - rows[0];
  return { x: RACK_X + (col - (rows[row] - 1) / 2) * RACK_STEP_X, y: RACK_Y + row * RACK_STEP_Y };
}

/**
 * Every piece that is in the air or in the rack at progress `t` (0 → 1).
 * One boy piece and one girl piece come loose on the first hit; the rest go up
 * on the second; they gather into the rack at the end.
 */
export function placePieces(t: number, rows: number[]): Placed[] {
  const count = rows[0] + rows[1];
  const settle = ease(span(t, 0.8, 0.99));
  const out: Placed[] = [];
  for (let i = 0; i < count; i++) {
    const early = i === 0 || i === rows[0];
    const from = early ? 0.3 : 0.63;
    const fly = span(t, from, from + 0.3);
    if (fly <= 0) continue;

    // up and out in a fan (never back toward Pip), then gravity takes over
    const a = rad(-140 + (i / Math.max(1, count - 1)) * 100);
    const dist = easeOut(fly) * (330 + (i % 3) * 110);
    const bx = FOE_X + Math.cos(a) * dist;
    const by = GROUND - 300 + Math.sin(a) * dist + 420 * fly * fly;
    const rack = rackSlot(i, rows);

    const x = lerp(bx, rack.x, settle);
    const y = lerp(by, rack.y, settle);
    const speed = (1 - settle) * clamp01(fly * 2.5) * (1 - fly * 0.6);
    out.push({
      i,
      x,
      y,
      rotate: lerp(fly * (240 + i * 51), 0, settle),
      scale: lerp(0.35, 1, clamp01(fly * 3)) * lerp(1, 1.05, settle),
      streak:
        speed > 0.15
          ? { x0: x - Math.cos(a) * 90 * speed, y0: y - Math.sin(a) * 90 * speed, x1: x, y1: y, width: 16 * speed, alpha: speed * 0.45 }
          : null,
    });
  }
  return out;
}
