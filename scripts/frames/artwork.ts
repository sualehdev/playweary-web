/**
 * Source of the placeholder frames. Not shipped: `npm run frames` bakes these
 * into public/frames/*.webp, and the site only ever loads those files.
 *
 * PLACEHOLDER FRAMES for the scroll-scrubbed sequence.
 *
 * A scroll sequence is a numbered run of images drawn to a canvas one at a time,
 * with scroll position picking the frame. The real ones are normally a 3D render
 * or a locked-off shoot, exported as a folder of webp.
 *
 * We have no such render, so these are generated: Pip hits SAME OLD twice, and
 * the grey blob bursts into the nine pieces the shirt actually ships with —
 * shades, goggles, spikes, hoodie, kit, scout shirt, hi-tops, trainers, boots —
 * which fly up and land as a finished 3 x 3 collection.
 *
 * Everything comes off one number, `t`, running 0 → 1 across the scroll, through
 * a small rig: `pip()`, `villain()`, `flyers()`. Nothing here is stateful, so any
 * frame can be drawn on its own, in any order, which is what scrubbing needs.
 *
 * To go live: delete `makeFrames` and hand ScrollSequence an array of real URLs
 * in order, e.g. `/frames/smash-0001.webp` … `/frames/smash-0142.webp`. Nothing
 * in ScrollSequence.tsx changes — it only ever sees a string[].
 */

/**
 * The space the artwork is drawn in. Wide, with the action across the middle
 * band, so the canvas can letterbox it at any viewport shape without cropping.
 */
const VIEW_W = 1600;
const VIEW_H = 1000;

/**
 * The size each frame is rasterised at — same aspect as the design space, so
 * nothing shifts. Kept under the design size on purpose: every frame here is an
 * SVG the browser must rasterise, dearer than decoding a webp, and a sequence
 * holds all its frames at once.
 */
export const FRAME_W = 1280;
export const FRAME_H = 800;
export const FRAME_COUNT = 72;

const INK = "#200242";
const FUR = "#F98A2E";
const CREAM = "#FFF3E0";
const VIOLET = "#9F3EFF";
const AMBER = "#FCC006";
const LIME = "#81DF40";
const PINK = "#FF2D60";
const GREY = "#8A8FA3";
/** The blob is drawn 300 tall; this is what makes it Pip-sized. */
const FOE_SCALE = 1.4;

const n = (v: number) => Math.round(v * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Progress of a move that runs between two points of the whole sequence. */
const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeIn = (t: number) => t * t * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Where the two of them stand. Ground is the line they both sit on. */
const GROUND = 800;
const PIP_X = 520;
const FOE_X = 1080;
const PIP_SCALE = 1.5;
/** The shoulder the mallet pivots on, and how far the mallet head reaches. */
const SHOULDER_X = PIP_X + 24 * PIP_SCALE;
const SHOULDER_Y = GROUND - 208 * PIP_SCALE;
const REACH = (86 + 238) * PIP_SCALE;
/** Where the mallet head is for a given swing angle — so a burst always lands
    where the mallet actually is, rather than at a point guessed in advance. */
const tipAt = (angle: number) => ({
  x: SHOULDER_X - Math.sin(rad(angle)) * REACH,
  y: SHOULDER_Y + Math.cos(rad(angle)) * REACH,
});

/* ----------------------------------------------------------------- the rig */

/** Arms and mallet as one rigid group, pivoting at the shoulder. */
function arm(angle: number) {
  return `
  <g transform="rotate(${n(angle)})">
    <path d="M0 0L0 86" stroke="${INK}" stroke-width="42" stroke-linecap="round"/>
    <path d="M0 0L0 86" stroke="${FUR}" stroke-width="30" stroke-linecap="round"/>
    <g transform="translate(0 86)">
      <rect x="-12" y="-6" width="24" height="156" rx="12" fill="#C98A4B" stroke="${INK}" stroke-width="8"/>
      <rect x="-74" y="140" width="148" height="98" rx="20" fill="#C3CCDC" stroke="${INK}" stroke-width="9"/>
      <rect x="-70" y="146" width="140" height="26" rx="13" fill="#fff" opacity=".5"/>
      <rect x="-74" y="184" width="148" height="24" fill="${INK}" opacity=".13"/>
      <circle cx="0" cy="2" r="20" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>
    </g>
  </g>`;
}

/**
 * Pip, facing right, feet at the origin. `angle` swings the mallet, `lean`
 * tips his whole body into the swing, `hop` lifts him off the ground.
 */
function pip(angle: number, lean: number, hop: number) {
  return `
  <g transform="translate(${PIP_X} ${n(GROUND - hop)}) scale(${PIP_SCALE}) rotate(${n(lean)})">
    <path d="M-40 -120C-120 -140 -152 -200 -122 -244" fill="none" stroke="${INK}" stroke-width="54" stroke-linecap="round"/>
    <path d="M-40 -120C-120 -140 -152 -200 -122 -244" fill="none" stroke="${FUR}" stroke-width="42" stroke-linecap="round"/>
    <path d="M-134 -232C-126 -244 -124 -240 -122 -244" stroke="${CREAM}" stroke-width="42" stroke-linecap="round" fill="none"/>

    <ellipse cx="-26" cy="-16" rx="34" ry="20" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>
    <ellipse cx="34" cy="-16" rx="34" ry="20" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>

    <ellipse cx="0" cy="-128" rx="74" ry="96" fill="${FUR}" stroke="${INK}" stroke-width="9"/>
    <ellipse cx="16" cy="-116" rx="40" ry="62" fill="${CREAM}" stroke="${INK}" stroke-width="7"/>
    <path d="M-52 -206c30 22 74 22 104 0 6 14 4 28-4 36-28 16-70 16-96 0-8-8-10-22-4-36Z" fill="${VIOLET}" stroke="${INK}" stroke-width="8"/>

    <path d="M-30 -306L-58 -392L24 -344Z" fill="${FUR}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M46 -310L78 -390L12 -350Z" fill="${FUR}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="8" cy="-268" rx="66" ry="60" fill="${FUR}" stroke="${INK}" stroke-width="9"/>
    <ellipse cx="54" cy="-248" rx="34" ry="26" fill="${CREAM}" stroke="${INK}" stroke-width="7"/>
    <circle cx="80" cy="-256" r="10" fill="${INK}"/>
    <ellipse cx="36" cy="-286" rx="10" ry="12" fill="${INK}"/>
    <circle cx="40" cy="-291" r="4" fill="#fff"/>
    <path d="M18 -308c10-7 24-7 32-2" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="-16" cy="-238" rx="17" ry="10" fill="${PINK}" opacity=".26"/>

    <g transform="translate(24 -208)">${arm(angle)}</g>
  </g>`;
}

/**
 * SAME OLD: the grey blob. `sx`/`sy` squash it about its own base; `cracks`
 * fades in the damage it carries out of the first hit.
 */
function villain(sx: number, sy: number, opacity: number, cracks: number) {
  if (opacity <= 0) return "";
  return `
  <g transform="translate(${FOE_X} ${GROUND}) scale(${n(sx * FOE_SCALE)} ${n(
    sy * FOE_SCALE
  )})" opacity="${n(opacity)}">
    <path d="M-140 -168c-42 8-66 32-72 62" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>
    <path d="M140 -168c42 8 66 32 72 62" fill="none" stroke="${INK}" stroke-width="36" stroke-linecap="round"/>
    <path d="M-140 -168c-42 8-66 32-72 62" fill="none" stroke="${GREY}" stroke-width="24" stroke-linecap="round"/>
    <path d="M140 -168c42 8 66 32 72 62" fill="none" stroke="${GREY}" stroke-width="24" stroke-linecap="round"/>

    <path d="M-142 0C-158 -142 -116 -300 0 -300 116 -300 158 -142 142 0Z" fill="${GREY}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <path d="M-124 0C-134 -58 -122 -78 0 -78 122 -78 134 -58 124 0Z" fill="#6E7488" opacity=".55"/>
    <path d="M-96 -232c26-30 62-40 96-34" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".2"/>

    <ellipse cx="-46" cy="-196" rx="31" ry="35" fill="#fff" stroke="${INK}" stroke-width="7"/>
    <ellipse cx="46" cy="-196" rx="31" ry="35" fill="#fff" stroke="${INK}" stroke-width="7"/>
    <circle cx="-38" cy="-190" r="13" fill="${INK}"/>
    <circle cx="54" cy="-190" r="13" fill="${INK}"/>
    <path d="M-82 -246L-16 -222" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
    <path d="M82 -246L16 -222" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
    <path d="M-58 -128l22 20 22-20 22 20 22-20" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>

    <g opacity="${n(cracks)}" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round">
      <path d="M-104 -60l30-42-18-30 26-34"/>
      <path d="M96 -96l-26-34 16-38"/>
      <path d="M12 -70l-20-34"/>
    </g>
  </g>`;
}

/** A spiky impact burst, with short action lines thrown off it. */
function burst(cx: number, cy: number, r: number, opacity: number) {
  if (opacity <= 0 || r <= 0) return "";
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.46 : r;
    pts.push(`${n(cx + Math.cos(a) * rr)},${n(cy + Math.sin(a) * rr)}`);
  }
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    return `<path d="M${n(cx + Math.cos(a) * r * 1.25)} ${n(
      cy + Math.sin(a) * r * 1.25
    )}L${n(cx + Math.cos(a) * r * 1.72)} ${n(
      cy + Math.sin(a) * r * 1.72
    )}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`;
  }).join("");
  return `<g opacity="${n(opacity)}">${rays}<polygon points="${pts.join(
    " "
  )}" fill="${AMBER}" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.42)}" fill="#fff" opacity=".5"/></g>`;
}

/* -------------------------------------------------------------- the frame */

/** One frame, as a data: URI. `t` runs 0 → 1 across the whole sequence. */
export function frameAt(t: number) {
  // Angles are degrees clockwise from straight-down. The swings only ever count
  // UP through the arc (284, not -76) so the mallet travels over his head to get
  // there rather than backwards under his feet.
  const wind1 = ease(span(t, 0.1, 0.24));
  const hit1 = easeIn(span(t, 0.24, 0.3));
  const lift = ease(span(t, 0.32, 0.52));
  const hit2 = easeIn(span(t, 0.52, 0.63));
  const rest2 = ease(span(t, 0.63, 0.74));
  const victory = ease(span(t, 0.82, 1));
  let angle = lerp(140, 190, wind1);
  angle = lerp(angle, 284, hit1);
  angle = lerp(angle, 172, lift);
  angle = lerp(angle, 292, hit2);
  angle = lerp(angle, 300, rest2);
  angle = lerp(angle, 194, victory);

  const lean = (lerp(0, -8, wind1) + lerp(0, 9, hit1) + lerp(0, 9, hit2) - lerp(0, 8, lift)) * (1 - victory);
  const hop = Math.max(0, Math.sin(victory * Math.PI) * 46);

  // Hit one dents it. Hit two ends it.
  const pop1 = span(t, 0.3, 0.37);
  const pop2 = span(t, 0.63, 0.71);
  const flat = span(t, 0.63, 0.76);
  const wobble = Math.sin(span(t, 0.3, 0.52) * Math.PI * 4) * 0.09 * (1 - span(t, 0.3, 0.52));
  const foeSquashed = lerp(1, 0.74, ease(pop1)) * lerp(1, 0.1, ease(flat)) + wobble;
  const foeWide = lerp(1, 1.16, ease(pop1)) * lerp(1, 1.5, ease(flat));
  const foeFade = 1 - span(t, 0.68, 0.79);
  const loom = 1 + Math.sin(t * Math.PI * 5) * 0.02 * (1 - span(t, 0.2, 0.26));

  // Shake, decaying out of each hit.
  const shakeAmt =
    26 * (1 - span(t, 0.3, 0.46)) * span(t, 0.28, 0.31) +
    40 * (1 - span(t, 0.63, 0.82)) * span(t, 0.61, 0.64);
  const shakeX = Math.sin(t * 220) * shakeAmt;
  const shakeY = Math.cos(t * 265) * shakeAmt * 0.6;
  /** A spike that exists only between `from` and `to`: 1 at the hit, 0 by the end,
      and nothing at all outside. Used for both the flash and the bursts. */
  const spike = (from: number, to: number) => {
    const p = span(t, from, to);
    return p <= 0 || p >= 1 ? 0 : 1 - p;
  };
  const flash = spike(0.3, 0.34) * 0.4 + spike(0.63, 0.68) * 0.55;

  const tip = tipAt(angle);
  const swinging =
    span(t, 0.14, 0.3) * (1 - span(t, 0.3, 0.34)) + span(t, 0.46, 0.63) * (1 - span(t, 0.63, 0.68));
  const lines =
    swinging > 0.05
      ? [0, 1, 2]
          .map((i) => {
            const r = 300 + i * 66;
            return `<path d="M${n(SHOULDER_X + 30)} ${n(SHOULDER_Y - r)}A${n(r)} ${n(
              r
            )} 0 0 1 ${n(SHOULDER_X + 30 + r)} ${n(
              SHOULDER_Y
            )}" fill="none" stroke="${VIOLET}" stroke-width="10" stroke-linecap="round" opacity="${n(
              swinging * 0.4
            )}" stroke-dasharray="34 26"/>`;
          })
          .join("")
      : "";

  const rack = span(t, 0.86, 1);

  const body = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EFE0FF"/>
      <stop offset="58%" stop-color="#FDEFE4"/>
      <stop offset="100%" stop-color="#FFF7EF"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="52%" r="46%">
      <stop offset="0%" stop-color="#fff" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="72%">
      <stop offset="62%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity=".13"/>
    </radialGradient>
  </defs>
  <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#sky)"/>
  <ellipse cx="800" cy="560" rx="560" ry="380" fill="url(#spot)"/>
  <circle cx="${n(180 + t * 46)}" cy="${n(196 - t * 34)}" r="27" fill="${VIOLET}" opacity=".2"/>
  <circle cx="${n(1428 - t * 54)}" cy="${n(224 + t * 44)}" r="19" fill="${PINK}" opacity=".22"/>
  <circle cx="${n(306 - t * 34)}" cy="${n(140 + t * 24)}" r="21" fill="${LIME}" opacity=".26"/>
  <circle cx="${n(1322 + t * 34)}" cy="${n(148 - t * 28)}" r="31" fill="${AMBER}" opacity=".28"/>
  <rect x="0" y="${GROUND + 26}" width="${VIEW_W}" height="${VIEW_H - GROUND - 26}" fill="${VIOLET}" opacity=".07"/>
  <path d="M0 ${GROUND + 26}h${VIEW_W}" stroke="${INK}" stroke-width="5" opacity=".13"/>

  <g transform="translate(${n(shakeX)} ${n(shakeY)})">
    <ellipse cx="${PIP_X}" cy="${GROUND + 16}" rx="152" ry="27" fill="${INK}" opacity=".11"/>
    <ellipse cx="${FOE_X}" cy="${GROUND + 16}" rx="${n(210 * foeWide)}" ry="27" fill="${INK}" opacity="${n(
      0.11 * foeFade
    )}"/>
    ${
      rack > 0
        ? `<rect x="770" y="335" width="620" height="370" rx="34" fill="#fff" opacity="${n(
            rack * 0.45
          )}" stroke="${VIOLET}" stroke-width="5" stroke-dasharray="14 12" stroke-opacity="${n(
            rack * 0.5
          )}"/>`
        : ""
    }
    ${villain(foeWide, foeSquashed * loom, foeFade, ease(span(t, 0.3, 0.4)))}
    ${lines}
    ${pip(angle, lean, hop)}
    ${burst(tip.x, tip.y, lerp(70, 210, ease(pop1)), spike(0.3, 0.37))}
    ${burst(tip.x, tip.y, lerp(90, 400, ease(pop2)), spike(0.63, 0.71))}
  </g>
  <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#vig)"/>
  ${
    flash > 0.01
      ? `<rect width="${VIEW_W}" height="${VIEW_H}" fill="#fff" opacity="${n(flash)}"/>`
      : ""
  }`;

  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="${FRAME_W}" height="${FRAME_H}">${body}</svg>`
    )
  );
}

/** The whole run, in order — the shape a real sequence would arrive in. */
export function makeFrames(count = FRAME_COUNT) {
  return Array.from({ length: count }, (_, i) => frameAt(i / (count - 1)));
}
