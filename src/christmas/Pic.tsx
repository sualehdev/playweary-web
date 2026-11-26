"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

const DEFAULT_FORMATS = ["gif", "png", "webp"];

/**
 * Shows a generated image from /public/christmas when it exists, and the
 * built-in SVG drawing until then (or if the file is ever missing). So the art
 * can be dropped in file by file with no code change.
 */
export default function Pic({
  name,
  width,
  height,
  className,
  fallback,
  formats = DEFAULT_FORMATS,
}: {
  /** File name without extension, in public/christmas, e.g. "santa" */
  name: string;
  width: number;
  height: number;
  className?: string;
  fallback: React.ReactNode;
  /** File types to try, in order */
  formats?: string[];
}) {
  // try the formats in turn: a GIF (animated) first, then PNG, then WebP, then the drawing
  const [tried, setTried] = useState(0);
  if (tried >= formats.length) return <>{fallback}</>;
  return (
    <img
      className={className}
      src={`/christmas/${name}.${formats[tried]}`}
      width={width}
      height={height}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() => setTried((n) => n + 1)}
    />
  );
}
