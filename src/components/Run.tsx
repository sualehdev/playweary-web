"use client";

/**
 * The offline-dinosaur game, rewritten as the shop's own.
 *
 * The change that matters: the things in the air are the actual garment
 * cut-outs from `art.ts`, and jumping into one *catches* it — the dino puts it
 * on and keeps wearing it. Baskets on the ground and soap bubbles overhead are
 * the only things that end a run. Catch all three pieces of a set and the strip
 * under the game offers that set for the basket.
 *
 * Everything that changes 60 times a second lives in `game` (a ref) and is
 * written straight to the canvas or to a HUD node. React state is only for the
 * things a person changes: the run status, what has been caught, the banner.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { pieceSrc } from "@/content/art";
import { CHARACTERS, type Piece, type SlotType as PieceType } from "@/content/characters";
import { confetti } from "@/lib/effects";

// The runner is the boy's game: the nine things in the air are his nine pieces.
const SETS = CHARACTERS.boy.sets;
const PIECES = CHARACTERS.boy.pieces;
const setName = (id: string) => SETS.find((s) => s.id === id)?.name ?? id;

/* -------------------------------------------------------------- constants --
   Lengths are CSS pixels and the canvas is sized to its own box, so the game
   reads the same on a phone as on a desktop — a narrow screen simply shows
   less track ahead.                                                          */

const GRAVITY = 2300; // px/s²
const JUMP_V = -880; // ~168px of clearance, ~0.76s in the air
const SPEED_0 = 330; // px/s at the start
const SPEED_MAX = 690;
const FOOT = 54; // ground line, measured up from the bottom edge
const SKY = 250; // headroom the numbers above are written against
const PIECE_POINTS = 40;

/**
 * Every vertical length is written for a 250px sky and then multiplied by this.
 * Scaling gravity and the jump together keeps the arc exactly as long in time
 * and only changes how high it goes, so a short canvas on a phone plays the
 * same as a tall one — the dino simply never leaves the frame.
 */
const scaleFor = (h: number) => Math.max(0.68, Math.min(1.05, (h - FOOT) / SKY));

type Kind = "piece" | "basket" | "bubble";

type Entity = {
  kind: Kind;
  x: number;
  y: number; // top edge
  w: number;
  h: number;
  id?: string; // piece id, for the catchable ones
  taken?: boolean;
  bob?: number;
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: string };
type Float = { x: number; y: number; life: number; text: string };
type Cloud = { x: number; y: number; s: number };

type Game = {
  status: "idle" | "running" | "over";
  t: number;
  dist: number;
  bonus: number;
  speed: number;
  y: number; // dino's height above the ground line
  vy: number;
  ducking: boolean;
  gap: number; // distance still to travel before the next spawn
  ents: Entity[];
  sparks: Spark[];
  floats: Float[];
  clouds: Cloud[];
  worn: Partial<Record<PieceType, string>>;
  ground: number; // scroll offset of the ground texture
  s: number; // vertical scale, set from the canvas height
};

const fresh = (): Game => ({
  status: "idle",
  t: 0,
  dist: 0,
  bonus: 0,
  speed: SPEED_0,
  y: 0,
  vy: 0,
  ducking: false,
  gap: 420,
  ents: [],
  sparks: [],
  floats: [],
  clouds: [],
  worn: {},
  ground: 0,
  s: 1,
});

const INK = "#200242";
const VIOLET = "#9F3EFF";
const AMBER = "#FCC006";
const PINK = "#FF2D60";

const pad = (n: number) => String(n).padStart(5, "0");
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

/** A rounded, outlined box — most of the dino is built from these. */
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

export default function Run() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  // The two counters are written straight to their nodes rather than held in
  // state: the score changes every frame, and the best is read from storage
  // after mount, where a state write would only make the HUD hydrate twice.
  const bestElRef = useRef<HTMLElement>(null);
  const bestRef = useRef(0);
  const game = useRef<Game>(fresh());
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const size = useRef({ w: 0, h: 0 });
  const raf = useRef(0);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const caughtRef = useRef<string[]>([]);

  const [status, setStatus] = useState<"idle" | "running" | "over">("idle");
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [caught, setCaught] = useState<string[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  /* --------------------------------------------------------------- artwork --
     Nine cut-outs, decoded once, so a caught piece never lands as a blank. */

  useEffect(() => {
    PIECES.forEach((p) => {
      const im = new Image();
      im.src = pieceSrc("boy", p.id, 256);
      im.decode?.().catch(() => {
        /* the <img> path still draws it once it loads */
      });
      imgs.current[p.id] = im;
    });
    try {
      const b = Number(localStorage.getItem("playweary:run:best") || 0);
      if (b > 0) {
        bestRef.current = b;
        if (bestElRef.current) bestElRef.current.textContent = pad(b);
      }
    } catch {
      /* private mode — this visit simply has no history */
    }
  }, []);

  /* ----------------------------------------------------------------- draw -- */

  const drawDino = useCallback((ctx: CanvasRenderingContext2D, g: Game, gy: number) => {
    const duck = g.ducking && g.y === 0;
    const dead = g.status === "over";

    ctx.save();
    // Local space: the origin is between the dino's feet and one unit is one
    // pixel of the 250px sky everything below was drawn against.
    ctx.translate(Math.min(110, size.current.w * 0.16), gy - g.y);
    ctx.scale(g.s, g.s);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.fillStyle = VIOLET;

    if (duck) {
      ctx.beginPath(); // tail
      ctx.moveTo(4, -30);
      ctx.lineTo(-26, -36);
      ctx.lineTo(4, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      box(ctx, 0, -36, 66, 28, 13); // body
      box(ctx, 54, -40, 32, 24, 10); // head
      box(ctx, 10, -12, 14, 12, 5); // legs
      box(ctx, 34, -12, 14, 12, 5);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(74, -31, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath(); // tail
      ctx.moveTo(4, -44);
      ctx.lineTo(-24, -52);
      ctx.lineTo(4, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath(); // back spikes
      for (let i = 0; i < 3; i++) {
        const sx = 8 + i * 12;
        ctx.moveTo(sx, -44);
        ctx.lineTo(sx + 6, -55);
        ctx.lineTo(sx + 12, -44);
      }
      ctx.fillStyle = AMBER;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = VIOLET;
      box(ctx, 2, -46, 44, 32, 14); // body
      box(ctx, 30, -62, 16, 22, 7); // neck
      box(ctx, 32, -76, 34, 26, 10); // head

      // legs swing while the ground is moving, and split apart in the air
      const swing = g.status === "running" ? Math.sin(g.t * 16) : 0;
      const air = g.y > 2;
      box(ctx, 12 + (air ? -6 : swing * 7), -18, 12, 18, 5);
      box(ctx, 28 + (air ? 6 : -swing * 7), -18, 12, 18, 5);
      box(ctx, 38, -44, 12, 9, 4); // arm

      if (dead) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, -68);
        ctx.lineTo(58, -60);
        ctx.moveTo(58, -68);
        ctx.lineTo(50, -60);
        ctx.stroke();
      } else {
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(54, -64, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // and everything it has caught so far, worn on the run
    const slots: { type: PieceType; cx: number; cy: number; w: number }[] = duck
      ? [
          { type: "hair", cx: 70, cy: -46, w: 38 },
          { type: "outfit", cx: 30, cy: -24, w: 42 },
          { type: "shoes", cx: 28, cy: -2, w: 40 },
        ]
      : [
          { type: "hair", cx: 49, cy: -80, w: 40 },
          { type: "outfit", cx: 24, cy: -32, w: 44 },
          { type: "shoes", cx: 26, cy: -4, w: 42 },
        ];
    slots.forEach((s) => {
      const id = g.worn[s.type];
      const im = id ? imgs.current[id] : undefined;
      if (!im?.complete || !im.naturalWidth) return;
      const h = (im.naturalHeight / im.naturalWidth) * s.w;
      ctx.drawImage(im, s.cx - s.w / 2, s.cy - h / 2, s.w, h);
    });
    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { w, h } = size.current;
    const g = game.current;
    const gy = h - FOOT;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,.9)";
    g.clouds.forEach((c) => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 34 * c.s, 13 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 24 * c.s, c.y - 7 * c.s, 22 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 26 * c.s, c.y + 2 * c.s, 18 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // the ground: one line, plus pebbles that scroll with the run
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, gy + 2);
    ctx.lineTo(w, gy + 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(32,2,66,.28)";
    const span = w + 140;
    for (let i = 0; i < 26; i++) {
      const x = ((((i * 137.5 - g.ground) % span) + span) % span) - 70;
      ctx.fillRect(x, gy + 12 + ((i * 53) % 26), ((i * 7) % 3) + 3, 3);
    }

    g.ents.forEach((e) => {
      if (e.kind === "piece") {
        if (e.taken) return;
        const im = imgs.current[e.id as string];
        const bob = Math.sin((g.t * 3 + (e.bob || 0)) * 1.6) * 5;
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2 + bob);
        // the catch halo, so a piece never reads as something to dodge
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(e.w, e.h) * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(252,192,6,.22)";
        ctx.fill();
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -g.t * 26;
        ctx.stroke();
        ctx.setLineDash([]);
        if (im?.complete && im.naturalWidth) ctx.drawImage(im, -e.w / 2, -e.h / 2, e.w, e.h);
        ctx.restore();
        return;
      }

      if (e.kind === "basket") {
        ctx.fillStyle = "#EBD9FF";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + 8);
        ctx.lineTo(e.x + e.w, e.y + 8);
        ctx.lineTo(e.x + e.w - 5, e.y + e.h);
        ctx.lineTo(e.x + 5, e.y + e.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = INK;
        box(ctx, e.x - 3, e.y, e.w + 6, 10, 5);
        ctx.strokeStyle = "rgba(32,2,66,.4)";
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          ctx.moveTo(e.x + (e.w / 3) * i, e.y + 16);
          ctx.lineTo(e.x + (e.w / 3) * i, e.y + e.h - 6);
        }
        ctx.stroke();
        return;
      }

      // bubble — the one you duck under
      const r = e.w / 2;
      ctx.save();
      ctx.translate(e.x + r, e.y + r + Math.sin((g.t * 4 + (e.bob || 0)) * 1.2) * 4);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(129,223,64,.35)";
      ctx.fill();
      ctx.strokeStyle = "#4E9D16";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.34, r * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.fill();
      ctx.restore();
    });

    drawDino(ctx, g, gy);

    g.sparks.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life * 2.2);
      ctx.fillStyle = s.hue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    g.floats.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6));
      ctx.fillStyle = PINK;
      ctx.font = '800 20px "Baloo 2", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }, [drawDino]);

  /* ----------------------------------------------------------------- step -- */

  const spawn = useCallback(() => {
    const { w, h } = size.current;
    const g = game.current;
    const gy = h - FOOT;
    const s = g.s;
    const roll = Math.random();
    const bubblesOn = g.dist > 2600; // they arrive once the run is warm

    if (roll < 0.46) {
      // a piece to catch — one that is still missing, most of the time
      const missing = PIECES.filter((p) => !caughtRef.current.includes(p.id));
      const p: Piece = missing.length && Math.random() < 0.78 ? pick(missing) : pick(PIECES);
      const im = imgs.current[p.id];
      const ww = 58 * s;
      const hh = im?.naturalWidth ? (im.naturalHeight / im.naturalWidth) * ww : 52 * s;
      // Placed by its underside, not its middle, because the cut-outs are all
      // different heights: 84 clears a standing dino (76 tall), so a piece is
      // always a jump, and 150 stays inside the arc (which peaks at ~168).
      g.ents.push({
        kind: "piece",
        id: p.id,
        x: w + 40,
        y: gy - rand(84, 150) * s - hh,
        w: ww,
        h: hh,
        bob: rand(0, 6),
      });
      g.gap = rand(300, 460);
      return;
    }
    if (bubblesOn && roll > 0.88) {
      // hangs low enough to clip a standing dino (top at 76) and high enough to
      // clear a ducking one (top at 40) — its underside sits at 58
      const d = 46 * s;
      g.ents.push({ kind: "bubble", x: w + 40, y: gy - 58 * s - d, w: d, h: d, bob: rand(0, 6) });
      g.gap = rand(430, 620);
      return;
    }
    const hh = rand(40, 58) * s;
    g.ents.push({ kind: "basket", x: w + 40, y: gy - hh, w: rand(32, 50) * s, h: hh });
    g.gap = rand(330, 520);
  }, []);

  const endRun = useCallback(() => {
    const g = game.current;
    g.status = "over";
    setStatus("over");
    const final = Math.floor(g.dist / 12) + g.bonus;
    setScore(final);
    const beat = final > bestRef.current;
    setNewBest(beat);
    if (beat) {
      bestRef.current = final;
      if (bestElRef.current) bestElRef.current.textContent = pad(final);
      try {
        localStorage.setItem("playweary:run:best", String(final));
      } catch {
        /* nothing to keep it in — the score still stands for this visit */
      }
    }
  }, []);

  const collect = useCallback((e: Entity) => {
    const g = game.current;
    const p = PIECES.find((x) => x.id === e.id) as Piece;
    e.taken = true;
    g.bonus += PIECE_POINTS;
    g.worn[p.type] = p.id; // he wears it for the rest of the run
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(60, 230);
      g.sparks.push({
        x: e.x + e.w / 2,
        y: e.y + e.h / 2,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.35, 0.6),
        hue: pick([AMBER, PINK, VIOLET]),
      });
    }
    g.floats.push({ x: e.x + e.w / 2, y: e.y, life: 0.9, text: "+" + PIECE_POINTS });

    if (caughtRef.current.includes(p.id)) return;
    const next = [...caughtRef.current, p.id];
    caughtRef.current = next;
    setCaught(next);
    const whole = PIECES.filter((q) => q.set === p.set).every((q) => next.includes(q.id));
    setBanner(
      whole ? setName(p.set).toUpperCase() + " COMPLETE!" : p.name.toUpperCase() + " CAUGHT!"
    );
    if (whole && stageRef.current) confetti(stageRef.current);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), whole ? 2600 : 1500);
  }, []);

  const step = useCallback(
    (dt: number) => {
      const g = game.current;
      const { w, h } = size.current;
      const gy = h - FOOT;
      g.t += dt;

      // clouds drift whatever the state, so an idle strip is not a dead one
      g.clouds.forEach((c) => {
        c.x -= (14 + c.s * 22) * dt;
        if (c.x < -90) {
          c.x = w + rand(20, 160);
          c.y = rand(28, h * 0.42);
        }
      });
      g.sparks = g.sparks.filter((s) => (s.life -= dt) > 0);
      g.sparks.forEach((s) => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 420 * dt;
      });
      g.floats = g.floats.filter((f) => (f.life -= dt) > 0);
      g.floats.forEach((f) => (f.y -= 46 * dt));

      if (g.status !== "running") return;

      g.speed = Math.min(SPEED_MAX, SPEED_0 + g.dist / 26);
      const move = g.speed * dt;
      g.dist += move;
      g.ground += move;

      if (g.y > 0 || g.vy !== 0) {
        // gravity and the jump carry the same scale, so the arc keeps its
        // timing on a short canvas and only loses height
        g.vy += GRAVITY * g.s * (g.ducking ? 1.7 : 1) * dt; // holding ↓ drops him faster
        g.y -= g.vy * dt;
        if (g.y <= 0) {
          g.y = 0;
          g.vy = 0;
        }
      }

      if ((g.gap -= move) <= 0) spawn();
      g.ents.forEach((e) => (e.x -= move));
      g.ents = g.ents.filter((e) => e.x + e.w > -60);

      // the dino's box, kept generous enough that a near miss stays a miss
      const dx = Math.min(110, w * 0.16);
      const duck = g.ducking && g.y === 0;
      const dW = (duck ? 84 : 64) * g.s;
      const dH = (duck ? 40 : 76) * g.s;
      const dTop = gy - g.y - dH;
      const in1 = 7 * g.s;

      for (const e of g.ents) {
        const hit =
          dx + in1 < e.x + e.w - 4 &&
          dx + dW - in1 > e.x + 4 &&
          dTop + in1 < e.y + e.h - 4 &&
          dTop + dH - in1 > e.y + 4;
        if (!hit) continue;
        if (e.kind === "piece") {
          if (!e.taken) collect(e);
        } else {
          endRun();
          return;
        }
      }

      if (scoreRef.current)
        scoreRef.current.textContent = String(Math.floor(g.dist / 12) + g.bonus).padStart(5, "0");
    },
    [collect, endRun, spawn]
  );

  /* ------------------------------------------------------------- the loop -- */

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    if (!cv || !stage) return;

    const fit = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: Math.round(r.width), h: Math.round(r.height) };
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = game.current;
      g.s = scaleFor(size.current.h);
      if (!g.clouds.length)
        g.clouds = Array.from({ length: 4 }, (_, i) => ({
          x: (size.current.w / 4) * i + rand(0, 80),
          y: rand(26, size.current.h * 0.42),
          s: rand(0.55, 1.05),
        }));
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      raf.current = requestAnimationFrame(frame);
    };
    const run = () => {
      if (raf.current) return;
      last = performance.now();
      raf.current = requestAnimationFrame(frame);
    };
    const halt = () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
    run();

    // a run does not continue behind your back: scroll away and it stops
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) run();
        else {
          halt();
          if (game.current.status === "running") {
            game.current.status = "idle";
            setStatus("idle");
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(stage);

    // nor does it run in a background tab
    const onVisibility = () => {
      if (!document.hidden) return;
      halt();
      if (game.current.status === "running") {
        game.current.status = "idle";
        setStatus("idle");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const timer = bannerTimer;
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      halt();
      ro.disconnect();
      io.disconnect();
      clearTimeout(timer.current);
    };
  }, [draw, step]);

  /* ---------------------------------------------------------------- input -- */

  const start = useCallback(() => {
    const g = game.current;
    const { clouds, s } = g; // the sky and the canvas scale outlive a run
    Object.assign(g, fresh(), { clouds, s, status: "running" });
    setScore(0);
    setNewBest(false);
    setStatus("running");
    stageRef.current?.focus();
  }, []);

  const jump = useCallback(() => {
    const g = game.current;
    if (g.status !== "running") {
      start();
      return;
    }
    if (g.y === 0) {
      g.vy = JUMP_V * g.s;
      g.y = 0.01;
      g.ducking = false;
    }
  }, [start]);

  const setDuck = useCallback((on: boolean) => {
    game.current.ducking = on;
  }, []);

  return (
    <section id="run">
      <div className="wrap">
        <div className="eyebrow">the no-internet game, but ours</div>
        <h2>Catch the pieces</h2>
        <p className="lede" style={{ marginTop: ".6rem" }}>
          The dinosaur runs, you jump, and whatever he jumps into he <b>catches and wears</b>. The
          nine things in the air are the nine real pieces. Wash baskets on the ground and soap
          bubbles overhead are the only things that end a run.
        </p>

        <div
          className="runStage"
          ref={stageRef}
          tabIndex={0}
          role="application"
          aria-label="Catch the pieces, a running game. Space or up arrow to jump, down arrow to duck."
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
              e.preventDefault();
              jump();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setDuck(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === "ArrowDown") setDuck(false);
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            stageRef.current?.focus();
            jump();
          }}
        >
          <canvas ref={canvasRef} className="runCanvas" />

          <div className="runHud">
            <span className="pill light">
              caught <b>{caught.length}</b>/9
            </span>
            <span className="pill light">
              best <b ref={bestElRef}>00000</b>
            </span>
            <span className="pill">
              <b ref={scoreRef}>00000</b>
            </span>
          </div>

          {banner ? (
            <div className="runBanner" role="status">
              {banner}
            </div>
          ) : null}

          {status !== "running" ? (
            <div className="runOverlay">
              <div className="runCard">
                {status === "over" ? (
                  <>
                    <h3>Out of the run</h3>
                    <p>
                      {score.toLocaleString("en-PK")} points · {caught.length} of 9 pieces caught
                      {newBest ? " · new best" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>Ready?</h3>
                    <p>
                      <b>Space</b> or <b>↑</b> to jump · <b>↓</b> to duck · tap anywhere on a phone
                    </p>
                  </>
                )}
                <button className="btn" type="button" onClick={start}>
                  {status === "over" ? "Run again" : "Start running"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Shown only on touch, where there are no arrow keys. `display:none`
              elsewhere keeps them out of the tab order without aria-hidden. */}
          <div className="runTouch">
            <button
              type="button"
              className="btn ghost sm"
              onPointerDown={(e) => {
                e.stopPropagation();
                jump();
              }}
            >
              Jump
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDuck(true);
              }}
              onPointerUp={() => setDuck(false)}
              onPointerLeave={() => setDuck(false)}
            >
              Duck
            </button>
          </div>
        </div>

        <p className="note" style={{ marginTop: ".7rem" }}>
          Click the strip once so the arrow keys reach the game and not the page.
        </p>
      </div>
    </section>
  );
}
