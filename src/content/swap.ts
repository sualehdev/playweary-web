/**
 * "The swap" scroll sequence: where its frames live and what its captions say.
 *
 * Frames are numbered WebP files in public/frames, one set per width:
 *   /frames/swap-0001-960.webp … /frames/swap-0072-960.webp   (phones)
 *   /frames/swap-0001-1280.webp … /frames/swap-0072-1280.webp (everything else)
 *
 * The ones there now are baked from placeholder art (`npm run frames`). To go
 * live, export the real render into those names and set FRAME_COUNT.
 */

export const FRAME_COUNT = 72;
export const FRAME_WIDTHS = [960, 1280] as const;

const pad = (n: number) => String(n).padStart(4, "0");

/** Every frame, in order, at the smallest width that is at least `width` px. */
export function frameUrls(width: number, count = FRAME_COUNT) {
  const w = FRAME_WIDTHS.find((x) => x >= width) ?? FRAME_WIDTHS[FRAME_WIDTHS.length - 1];
  return Array.from({ length: count }, (_, i) => `/frames/swap-${pad(i + 1)}-${w}.webp`);
}

/**
 * Lines that fade through as the sequence runs. `from`/`to` are points on the
 * same 0 → 1 progress the frames are picked from.
 */
export const CAPTIONS: { text: string; from: number; to: number }[] = [
  { text: "same old, same old", from: 0.02, to: 0.22 },
  { text: "not today", from: 0.26, to: 0.44 },
  { text: "again…", from: 0.48, to: 0.6 },
  { text: "SMASH", from: 0.62, to: 0.78 },
  { text: "a look for every kid.", from: 0.84, to: 1 },
];
