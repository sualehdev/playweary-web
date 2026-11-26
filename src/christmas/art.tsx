/** Hand-drawn SVG scenery: tiny, sharp at any size, no image requests. */

export function Tree({ className }: { className?: string }) {
  return (
    <svg className={"xTree " + (className ?? "")} viewBox="0 0 120 170" aria-hidden="true" focusable="false">
      <rect x="51" y="132" width="18" height="22" rx="3" fill="#7a4a2b" />
      <path d="M60 30 L100 80 H20 Z" fill="#1f8a4c" stroke="#0f5f33" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 52 L106 108 H14 Z" fill="#26a65b" stroke="#0f5f33" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 76 L112 138 H8 Z" fill="#2fbf6a" stroke="#0f5f33" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="60,12 65,24 78,25 68,33 71,46 60,39 49,46 52,33 42,25 55,24" fill="#fcc006" stroke="#c98f00" strokeWidth="2" strokeLinejoin="round" className="xStar" />
      <circle cx="46" cy="72" r="5" fill="#ff3b5c" className="xBulb b1" />
      <circle cx="72" cy="66" r="5" fill="#9f3eff" className="xBulb b2" />
      <circle cx="38" cy="100" r="5" fill="#fcc006" className="xBulb b3" />
      <circle cx="62" cy="96" r="5" fill="#ff3b5c" className="xBulb b2" />
      <circle cx="84" cy="102" r="5" fill="#4dd0ff" className="xBulb b1" />
      <circle cx="28" cy="128" r="5" fill="#9f3eff" className="xBulb b2" />
      <circle cx="54" cy="124" r="5" fill="#fcc006" className="xBulb b1" />
      <circle cx="80" cy="128" r="5" fill="#ff3b5c" className="xBulb b3" />
      <circle cx="98" cy="130" r="5" fill="#4dd0ff" className="xBulb b2" />
      <rect x="22" y="146" width="26" height="22" rx="3" fill="#ff3b5c" stroke="#a3123c" strokeWidth="2.500" />
      <rect x="33" y="146" width="4" height="22" fill="#fcc006" />
      <rect x="22" y="154" width="26" height="4" fill="#fcc006" />
      <rect x="76" y="150" width="24" height="18" rx="3" fill="#9f3eff" stroke="#6a18bd" strokeWidth="2.500" />
      <rect x="86" y="150" width="4" height="18" fill="#fcc006" />
    </svg>
  );
}

export function Santa({ className }: { className?: string }) {
  return (
    <svg className={"xSanta " + (className ?? "")} viewBox="0 0 130 160" aria-hidden="true" focusable="false">
      {/* boots + legs */}
      <rect x="40" y="126" width="18" height="26" rx="6" fill="#200242" />
      <rect x="68" y="126" width="18" height="26" rx="6" fill="#200242" />
      {/* body */}
      <path d="M30 128 Q28 76 63 70 Q98 76 96 128 Z" fill="#e0243f" stroke="#a3123c" strokeWidth="3" strokeLinejoin="round" />
      <rect x="30" y="102" width="66" height="10" fill="#200242" />
      <rect x="55" y="100" width="16" height="14" rx="2" fill="#fcc006" stroke="#c98f00" strokeWidth="2" />
      <path d="M30 128h66" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      {/* waving arm */}
      <g className="xWave">
        <path d="M92 86 Q112 70 112 46" stroke="#e0243f" strokeWidth="14" strokeLinecap="round" fill="none" />
        <circle cx="112" cy="42" r="8" fill="#ffd9b8" stroke="#d6a47c" strokeWidth="2" />
        <circle cx="112" cy="42" r="12" fill="#fff" opacity="0" />
      </g>
      <path d="M36 88 Q22 100 40 108" stroke="#e0243f" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* head */}
      <circle cx="63" cy="50" r="22" fill="#ffd9b8" stroke="#d6a47c" strokeWidth="2.500" />
      <path d="M41 54 Q44 84 63 88 Q82 84 85 54 Q74 66 63 62 Q52 66 41 54Z" fill="#fff" stroke="#dcd6e8" strokeWidth="2" />
      <ellipse cx="63" cy="54" rx="9" ry="4" fill="#fff" />
      <circle cx="54" cy="47" r="3" fill="#200242" />
      <circle cx="72" cy="47" r="3" fill="#200242" />
      <circle cx="63" cy="52" r="4.500" fill="#ff8a8a" />
      <circle cx="48" cy="54" r="4" fill="#ff9aa8" opacity=".7" />
      <circle cx="78" cy="54" r="4" fill="#ff9aa8" opacity=".7" />
      {/* hat */}
      <path d="M40 38 Q44 6 80 14 Q94 20 88 38 Z" fill="#e0243f" stroke="#a3123c" strokeWidth="3" strokeLinejoin="round" />
      <rect x="37" y="33" width="54" height="12" rx="6" fill="#fff" stroke="#dcd6e8" strokeWidth="2" />
      <circle cx="90" cy="16" r="7" fill="#fff" stroke="#dcd6e8" strokeWidth="2" />
    </svg>
  );
}

export function Present({ className, hue = "violet" }: { className?: string; hue?: "violet" | "red" | "green" }) {
  const c = { violet: ["#9f3eff", "#6a18bd"], red: ["#ff3b5c", "#a3123c"], green: ["#2fbf6a", "#0f5f33"] }[hue];
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="8" y="24" width="48" height="34" rx="5" fill={c[0]} stroke={c[1]} strokeWidth="3" />
      <rect x="5" y="16" width="54" height="14" rx="4" fill={c[0]} stroke={c[1]} strokeWidth="3" />
      <rect x="28" y="16" width="8" height="42" fill="#fcc006" />
      <path d="M32 16 C20 2 8 8 18 16 Z M32 16 C44 2 56 8 46 16 Z" fill="#fcc006" stroke="#c98f00" strokeWidth="2.500" strokeLinejoin="round" />
    </svg>
  );
}
