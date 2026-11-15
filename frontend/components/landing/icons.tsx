// Tiny SVG glyphs used inside the diagrams. Each draws at (x, y) as its top-left,
// in a 20 × 20 box, so diagrams can place them like text.

const CREAM = "#fefbf6";
const GOLD = "#d6bf7a";

type P = { x: number; y: number; c?: string; s?: number };

export function Wallet({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <rect x="1" y="4" width="18" height="13" rx="2" />
      <path d="M1 8h18M13 11.5h3" />
      <path d="M4 4V2.5h10V4" />
    </g>
  );
}

export function Person({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <circle cx="10" cy="6" r="4" />
      <path d="M2 19c0-4.5 3.6-7 8-7s8 2.5 8 7" />
    </g>
  );
}

export function Key({ x, y, c = GOLD, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <circle cx="6" cy="10" r="4.5" />
      <path d="M10.5 10H19M16 10v3.5M19 10v3" />
    </g>
  );
}

export function Eye({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="10" cy="10" r="2.6" />
    </g>
  );
}

export function Lock({ x, y, c = GOLD, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <path d="M6 9V6.5a4 4 0 018 0V9" />
      <rect x="3.5" y="9" width="13" height="9" rx="1.5" />
      <path d="M10 12.5v2" />
    </g>
  );
}

export function Laptop({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <rect x="3" y="3" width="14" height="10" rx="1" />
      <path d="M1 16h18" />
    </g>
  );
}

export function Shield({ x, y, c = GOLD, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth="1.3">
      <path d="M10 1.5l7 2.8v5.2c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V4.3z" />
      <path d="M6.5 10l2.5 2.5 4.5-5" />
    </g>
  );
}

export function GhostIcon({ x, y, c = GOLD, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M3 9a7 7 0 0114 0v9.5l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2L3 18.5z" fill={c} />
      <ellipse cx="7.5" cy="9" rx="1.3" ry="1.8" fill="#252324" />
      <ellipse cx="12.5" cy="9" rx="1.3" ry="1.8" fill="#252324" />
    </g>
  );
}

export function Tick({ x, y, c = GOLD, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="10" cy="10" r="9" fill={c} />
      <path d="M5.8 10.2l2.8 2.8 5.6-6" fill="none" stroke="#252324" strokeWidth="1.8" />
    </g>
  );
}

export function Cross({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="10" cy="10" r="9" fill="none" stroke={c} strokeOpacity=".7" strokeWidth="1.3" />
      <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke={c} strokeOpacity=".7" strokeWidth="1.5" />
    </g>
  );
}

export function Coin({ x, y, c = CREAM, s = 1 }: P) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="10" cy="10" r="8.5" fill="none" stroke={c} strokeWidth="1.3" />
      <text x="10" y="13.6" textAnchor="middle" fontSize="10" fontWeight="600" fill={c}>
        $
      </text>
    </g>
  );
}
