/**
 * Geometry for the mascot jigsaw.
 *
 * The mascot is drawn once, in board coordinates, inside <defs> (see Jigsaw.tsx).
 * Every tile is then the same artwork clipped to its own interlocking outline —
 * which is what this file generates. Nine tiles, 3 x 3, to rhyme with the nine
 * velcro pieces the shirt ships with.
 */

/** Side of the square board, in SVG user units. All paths below use these. */
export const BOARD = 540;
export const COLS = 3;
export const ROWS = 3;
/** Side of one cell — the tile's outline before its knobs stick out. */
export const CELL = BOARD / COLS;
/**
 * How far a knob reaches past its cell. The template below tops out at 0.36 of
 * the edge length, scaled by DEPTH — so this is the exact overhang, rounded up.
 */
export const PAD = 42;
/** Side of a tile's viewBox window: the cell plus knob room on all four sides. */
export const BOX = CELL + PAD * 2;

/**
 * One jigsaw edge as eight relative cubics, in edge-local space: x runs 0 → 1
 * along the edge, y is the perpendicular the knob bulges into. The x-profile
 * doubles back (0.38 → 0.32) to cut the undercut that makes a knob a knob.
 *
 * The shape is mirror-symmetric about its midpoint, which is what lets two
 * neighbours share it: one traverses it forwards, the other backwards with the
 * sign flipped, and both trace the identical curve.
 */
const KNOB: [number, number, number, number, number, number][] = [
  [0, 0, 0.35, 0, 0.37, 0],
  [0.02, 0, 0.02, -0.05, 0.01, -0.08],
  [-0.02, -0.06, -0.06, -0.08, -0.06, -0.14],
  [0, -0.09, 0.08, -0.14, 0.18, -0.14],
  [0.1, 0, 0.18, 0.05, 0.18, 0.14],
  [0, 0.06, -0.04, 0.08, -0.06, 0.14],
  [-0.01, 0.03, -0.01, 0.08, 0.01, 0.08],
  [0.02, 0, 0.37, 0, 0.37, 0],
];
/** Knob depth, as a fraction of the template's own. Full size looks spiky. */
const DEPTH = 0.62;

/**
 * Knob direction for every shared edge, hand-picked so no tile ends up with
 * four knobs pointing the same way. `H[r][c]` is the edge above row r (rows 1
 * and 2 only — row 0 is the board's straight top). `V[r][c]` is the edge to the
 * right of column c (columns 0 and 1 only).
 */
const H: number[][] = [
  [0, 0, 0],
  [1, -1, 1],
  [-1, 1, -1],
];
const V: number[][] = [
  [1, -1],
  [-1, 1],
  [1, -1],
];

const n = (v: number) => Math.round(v * 100) / 100;

/**
 * One side of a tile. `dx,dy` is the unit direction it is walked in; `sign` is
 * 0 for a board border (straight) or ±1 for the side the knob grows towards.
 */
function edge(dx: number, dy: number, sign: number) {
  if (!sign) return `l ${n(dx * CELL)} ${n(dy * CELL)}`;
  // Perpendicular to the direction of travel. Reversing dx,dy reverses this
  // too, which is exactly why a shared edge needs the opposite sign each way.
  const px = -dy;
  const py = dx;
  const k = CELL * DEPTH * sign;
  return KNOB.map((s) => {
    const out: number[] = [];
    for (let i = 0; i < 6; i += 2) {
      out.push(n(s[i] * CELL * dx + s[i + 1] * k * px), n(s[i] * CELL * dy + s[i + 1] * k * py));
    }
    return `c ${out.join(" ")}`;
  }).join(" ");
}

/** Outline of the tile at (row, col), walked clockwise from its top-left. */
function outline(row: number, col: number) {
  return [
    `M ${col * CELL} ${row * CELL}`,
    edge(1, 0, row === 0 ? 0 : H[row][col]),
    edge(0, 1, col === COLS - 1 ? 0 : V[row][col]),
    edge(-1, 0, row === ROWS - 1 ? 0 : -H[row + 1][col]),
    edge(0, -1, col === 0 ? 0 : -V[row][col - 1]),
    "Z",
  ].join(" ");
}

export type Tile = {
  id: number;
  row: number;
  col: number;
  /** Clip path, in board coordinates. */
  d: string;
  /** viewBox for a tile rendered on its own, windowed around its cell. */
  view: string;
  /** Where the tile sits on the board, as % of the board — it scales with it. */
  left: number;
  top: number;
  size: number;
};

export const TILES: Tile[] = Array.from({ length: ROWS * COLS }, (_, id) => {
  const row = Math.floor(id / COLS);
  const col = id % COLS;
  const x = col * CELL - PAD;
  const y = row * CELL - PAD;
  return {
    id,
    row,
    col,
    d: outline(row, col),
    view: `${x} ${y} ${BOX} ${BOX}`,
    left: (x / BOARD) * 100,
    top: (y / BOARD) * 100,
    size: (BOX / BOARD) * 100,
  };
});

/**
 * The order the loose tiles start in. Fixed rather than random so the server
 * and the client agree on the first render.
 */
export const SCRAMBLE = [4, 0, 7, 2, 8, 3, 6, 1, 5];

/** Centre of a tile's home on the board, as a fraction of the board's side. */
export const homeAt = (t: Tile) => ({
  fx: ((t.col + 0.5) * CELL) / BOARD,
  fy: ((t.row + 0.5) * CELL) / BOARD,
});

/** How close a tile has to land to count as home, as a fraction of the board. */
export const SNAP = (CELL / BOARD) * 0.55;
