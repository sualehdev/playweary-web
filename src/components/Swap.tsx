"use client";

/**
 * A scroll-scrubbed image sequence: a tall section, a sticky viewport-high
 * canvas, and one frame of a numbered run drawn per scroll position.
 *
 * Two decisions worth knowing about:
 *
 * - The sticky element is CSS `position: sticky`, not a GSAP pin. #show below
 *   already pins with ScrollTrigger, and a pin-spacer sitting directly after
 *   another pinned section is the usual cause of the two fighting over layout
 *   on refresh. Sticky needs no spacer, so the two sections stay independent.
 *
 * - Scroll drives a tween on a proxy number rather than being read straight off
 *   the trigger. That is what buys the eased catch-up of `scrub` — the frame
 *   chases the scroll rather than being nailed to it.
 *
 * Frames are numbered WebP files in public/frames (see src/content/swap.ts), so
 * swapping the placeholder art for a real render is a file replacement.
 */

import { useEffect, useRef, useState } from "react";
import { pieceSrc } from "@/content/art";
import { CAPTIONS, FRAME_COUNT, frameUrls } from "@/content/swap";
import { DESIGN_W, PIECE_BOX, RACK_ROWS, piecesFor, placePieces, rollLook, type Look } from "@/content/swapPieces";

/** How much scrolling the sequence spans, on top of the sticky viewport. */
const SCROLL_LENGTH = 2600;

export default function ScrollSequence() {
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const capsRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // phones get the smaller set; either way it is plain image files
    const frames = frameUrls(matchMedia("(max-width: 820px)").matches ? 960 : 1280);
    const imgs = frames.map(() => {
      const img = new Image();
      img.decoding = "async";
      return img;
    });
    // Load order matters more than load speed: the first and last frames, then
    // every fourth, then the gaps. A half-loaded sequence still scrubs (it
    // repeats the last frame it has), and it is smooth sooner.
    const order = [
      0,
      frames.length - 1,
      ...frames.map((_, i) => i).filter((i) => i % 4 === 0 && i !== 0 && i !== frames.length - 1),
      ...frames.map((_, i) => i).filter((i) => i % 4 !== 0 && i !== frames.length - 1),
    ];
    order.forEach((i) => (imgs[i].src = frames[i]));
    // Drop the images on the way out rather than blocking on them.
    cleanups.push(() => imgs.forEach((img) => (img.src = "")));

    let current = -1;
    let progress = 0;

    /* The pieces are the real ones, drawn over the baked frame. A new boy set and
       a new girl set are rolled each time the section is replayed (scrolled back
       to the top after it has played), and once at the start. */
    let look: Look = rollLook();
    const pieceImgs = new Map<string, HTMLImageElement>();
    const wanted = () => piecesFor(look);
    const loadPieces = () =>
      wanted().forEach((p) => {
        const key = p.character + p.id;
        if (pieceImgs.has(key)) return;
        const im = new Image();
        im.decoding = "async";
        im.onload = () => current >= 0 && paint(current);
        im.src = pieceSrc(p.character, p.id, 256);
        pieceImgs.set(key, im);
      });
    loadPieces();
    let played = false;

    function drawPieces(w: number, h: number, dw: number, dh: number) {
      if (!ctx) return;
      const k = dw / DESIGN_W; // design px -> css px
      const ox = (w - dw) / 2;
      const oy = (h - dh) / 2;
      const list = wanted();
      for (const p of placePieces(progress, RACK_ROWS)) {
        const piece = list[p.i];
        const im = pieceImgs.get(piece.character + piece.id);
        if (p.streak) {
          ctx.save();
          ctx.strokeStyle = "#9F3EFF";
          ctx.globalAlpha = p.streak.alpha;
          ctx.lineWidth = p.streak.width * k;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(ox + p.streak.x0 * k, oy + p.streak.y0 * k);
          ctx.lineTo(ox + p.streak.x1 * k, oy + p.streak.y1 * k);
          ctx.stroke();
          ctx.restore();
        }
        if (!im?.complete || !im.naturalWidth) continue;
        const fit = Math.min(PIECE_BOX / im.naturalWidth, PIECE_BOX / im.naturalHeight) * p.scale * k;
        ctx.save();
        ctx.translate(ox + p.x * k, oy + p.y * k);
        ctx.rotate((p.rotate * Math.PI) / 180);
        ctx.shadowColor = "rgba(32,2,66,.28)";
        ctx.shadowBlur = 12 * k;
        ctx.shadowOffsetY = 5 * k;
        ctx.drawImage(im, (-im.naturalWidth * fit) / 2, (-im.naturalHeight * fit) / 2, im.naturalWidth * fit, im.naturalHeight * fit);
        ctx.restore();
      }
    }

    function paint(index: number) {
      const img = imgs[index];
      if (!ctx || !canvas || !img?.complete || !img.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // `contain`, not `cover`: this is a narrative beat, and a short wide
      // viewport cropping to cover cuts the mallet — and the character's
      // head — straight out of frame.
      const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      const ox = (w - dw) / 2;
      const oy = (h - dh) / 2;
      // Run the scene edge to edge: stretch the frame's own outermost column
      // (or row, on tall screens) across the letterbox, so the sky gradient and
      // the ground line carry on to the screen edge without cropping anything.
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (ox > 0.5) {
        ctx.drawImage(img, 1, 0, 1, nh, 0, oy, ox + 1, dh);
        ctx.drawImage(img, nw - 2, 0, 1, nh, ox + dw - 1, oy, w - ox - dw + 1, dh);
      } else if (oy > 0.5) {
        ctx.drawImage(img, 0, 1, nw, 1, ox, 0, dw, oy + 1);
        ctx.drawImage(img, 0, nh - 2, nw, 1, ox, oy + dh - 1, dw, h - oy - dh + 1);
      }
      ctx.drawImage(img, ox, oy, dw, dh);
      current = index;
      drawPieces(w, h, dw, dh);
    }

    /** Nearest frame at or before `index` that has actually decoded. */
    function nearestReady(index: number) {
      for (let i = index; i >= 0; i--) if (imgs[i].complete && imgs[i].naturalWidth) return i;
      return -1;
    }

    function show(p: number) {
      progress = p;
      // back at the top after it has played: next time, a different two sets
      if (p > 0.3) played = true;
      if (p < 0.06 && played) {
        played = false;
        look = rollLook();
        loadPieces();
      }
      const target = Math.round(p * (frames.length - 1));
      const usable = nearestReady(target);
      // the pieces move every update, even when the frame does not
      if (usable >= 0) paint(usable);
      CAPTIONS.forEach((c, i) => {
        const el = capsRef.current[i];
        if (!el) return;
        // fade over the first and last eighth of each caption's own stretch
        const fade = (c.to - c.from) / 8;
        const on = Math.min(Math.max((p - c.from) / fade, 0), Math.max((c.to - p) / fade, 0), 1);
        el.style.opacity = String(Math.max(on, 0));
      });
    }

    let settled = 0;
    const onOne = () => {
      if (cancelled) return;
      settled++;
      setLoaded(settled);
      // Paint as soon as there is anything to paint, so the section is never
      // an empty box, then let the rest stream in behind it.
      if (settled === 1) {
        paint(0);
        setReady(true);
      }
    };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth) onOne();
      else {
        img.addEventListener("load", onOne, { once: true });
        img.addEventListener("error", onOne, { once: true });
      }
    });

    const onResize = () => {
      if (current >= 0) {
        const at = current;
        current = -1;
        paint(at);
      }
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    if (reduced) {
      // No scrubbing: rest on the frame after the piece has stuck, and let the
      // section collapse to one screen rather than 2600px of empty scrolling.
      wrap.style.height = "auto";
      const settle = () => show(0.88);
      const t = setTimeout(settle, 120);
      cleanups.push(() => clearTimeout(t));
      show(0.88);
      return () => {
        cancelled = true;
        cleanups.forEach((fn) => fn());
      };
    }

    (async () => {
      const [gsapMod, stMod] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      const gsap = gsapMod.gsap;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const proxy = { f: 0 };
      const tween = gsap.to(proxy, {
        f: 1,
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
          // a reload landing mid-section has no scroll event to react to
          onRefresh: (self) => show(self.progress),
        },
        onUpdate: () => show(proxy.f),
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const pct = Math.round((loaded / FRAME_COUNT) * 100);

  return (
    <section
      id="swap"
      className="seqWrap"
      ref={wrapRef}
      style={{ height: `calc(${SCROLL_LENGTH}px + 100svh)` }}
    >
      <div className="seqSticky">
        <canvas
          className="seqCanvas"
          ref={canvasRef}
          role="img"
          aria-label="Pip the fox swinging a mallet at a grey blob called Same Old, which bursts into a boy's set and a girl's set of velcro pieces"
        />
        <div className="seqCaps" aria-hidden="true">
          {CAPTIONS.map((c, i) => (
            <p
              key={c.text}
              className="seqCap"
              style={{ opacity: 0 }}
              ref={(el) => {
                capsRef.current[i] = el;
              }}
            >
              {c.text}
            </p>
          ))}
        </div>
        {/* The text the captions carry, once, for anyone not watching it move. */}
        <p className="seqRead">
          Pip flattens Same Old with a mallet, and it bursts into a boy&apos;s set and a girl&apos;s set, ready
          to wear.
        </p>
        {!ready ? (
          <div className="seqLoad">
            <i style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        <div className="seqHint" aria-hidden="true">
          scroll to swap ↓
        </div>
      </div>
    </section>
  );
}
