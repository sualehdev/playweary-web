import { type CharacterId, baseArt, baseSrc, PRINT } from "@/content/art";
import { type ShirtColour, SHIRT_COLOURS, readableOn } from "@/content/products";

/** Shared SVG defs the tee clips against. Render once per page. */
export function TeeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id="teeBodyClip">
          <path d="M120 55h460v572q0 20-20 20H140q-20 0-20-20z" />
        </clipPath>
        <clipPath id="teeBadgeClip">
          <circle cx="496" cy="186" r="44" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* The print area inside the 700-unit viewBox. */
const PX = 120;
const PY = 55;
const PW = 460;
const PH = 592;

type Props = {
  id?: string;
  character?: CharacterId;
  /** The layer the pieces are dropped onto; rendered above the print. */
  children?: React.ReactNode;
  /** Adds the chest badge and hem name the personalise tray drives. */
  custom?: boolean;
  shirt?: ShirtColour;
  name?: string;
  badge?: string | null;
  label?: string;
  /** Draw her without the base dress: an outfit is on. */
  bare?: boolean;
};

/**
 * The shirt. The printed character is the real transparent base art drawn into
 * the SVG, so it sits correctly on any shirt colour. Children render in the
 * piece layer above it, in the same percentage coordinates as the manifest.
 */
export default function Tee({
  id,
  character = "boy",
  children,
  custom,
  shirt = SHIRT_COLOURS[0],
  name = "",
  badge = null,
  label,
  bare = false,
}: Props) {
  const base = baseArt(character);
  const charH = ((PRINT.charBottom - PRINT.charTop) / 100) * PH;
  const charW = (charH * base.w) / base.h;
  const cx = PX + (PRINT.cx / 100) * PW;
  const top = PY + (PRINT.charTop / 100) * PH;
  const text = name.toUpperCase();
  return (
    <div className="teeWrap" id={id} data-tee role={label ? "img" : undefined} aria-label={label}>
      <svg className="teeSvg" viewBox="0 0 700 700" aria-hidden="true">
        <path
          className="teeBody"
          d="M265 55C275 130 425 130 435 55L580 55L665 140L630 265L580 225L580 627Q580 647 560 647L140 647Q120 647 120 627L120 225L70 265L35 140L120 55Z"
          style={{ fill: shirt.body, stroke: shirt.line }}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <image
          className="teePrint"
          href={baseSrc(character, 640, bare)}
          x={cx - charW / 2}
          y={top}
          width={charW}
          height={charH}
          clipPath="url(#teeBodyClip)"
          preserveAspectRatio="xMidYMid meet"
        />
        {custom ? (
          <>
            <image
              className="teeBadge"
              x="452"
              y="142"
              width="88"
              height="88"
              clipPath="url(#teeBadgeClip)"
              preserveAspectRatio="xMidYMid slice"
              href={badge ?? undefined}
              display={badge ? undefined : "none"}
            />
            <circle className="teeBadgeRing" cx="496" cy="186" r="44" display={badge ? undefined : "none"} />
            <text
              className="teeName"
              x="350"
              y="600"
              fill={readableOn(shirt.body)}
              style={{ fontSize: (text.length > 9 ? 46 - (text.length - 9) * 3.2 : 46) + "px" }}
            >
              {text}
            </text>
          </>
        ) : null}
        <path
          className="teeCollar"
          d="M265 55C275 130 425 130 435 55Z"
          style={{ fill: shirt.collar, stroke: shirt.line }}
          strokeWidth="5"
        />
      </svg>
      {children}
    </div>
  );
}
