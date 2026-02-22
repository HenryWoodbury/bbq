"use client";

import { useId } from "react";

type Pt = [number, number];

function bPt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

function bDeriv(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    3 * u ** 2 * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t ** 2 * (p3[0] - p2[0]),
    3 * u ** 2 * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t ** 2 * (p3[1] - p2[1]),
  ];
}

interface StitchMark {
  ax1: number; ay1: number; ax2: number; ay2: number; // near side
  bx1: number; by1: number; bx2: number; by2: number; // far side
}

/** Two short bars on each side of the seam, perpendicular to the tangent. */
function genStitches(
  p0: Pt, p1: Pt, p2: Pt, p3: Pt,
  count: number,
  inner: number, // distance from seam to near end of bar
  outer: number, // distance from seam to far end of bar
): StitchMark[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    const [px, py] = bPt(p0, p1, p2, p3, t);
    const [dx, dy] = bDeriv(p0, p1, p2, p3, t);
    const len = Math.hypot(dx, dy);
    if (len === 0) return { ax1: px, ay1: py, ax2: px, ay2: py, bx1: px, by1: py, bx2: px, by2: py };
    // Normal (perpendicular to tangent)
    const nx = -dy / len;
    const ny = dx / len;
    return {
      ax1: px + nx * inner, ay1: py + ny * inner,
      ax2: px + nx * outer, ay2: py + ny * outer,
      bx1: px - nx * inner, by1: py - ny * inner,
      bx2: px - nx * outer, by2: py - ny * outer,
    };
  });
}

// ── Seam geometry ────────────────────────────────────────────────────────────
// Portrait baseball seam, circle r=46 centred at (50,50).
// Two S-curves: seam 1 (left) and seam 2 (right, 180° rotated).
// Each seam is two joined cubic Béziers sharing a midpoint.
//
// Seam 1 — left side:  top-left → mid-left → bottom-left (S-curve)
const A: [Pt, Pt, Pt, Pt] = [[34, 7],  [4, 20],  [4, 48],  [34, 52]];
const B: [Pt, Pt, Pt, Pt] = [[34, 52], [64, 56], [64, 82], [34, 93]];
// Seam 2 — right side: (x,y) → (100-x, 100-y) rotation of seam 1
const C: [Pt, Pt, Pt, Pt] = [[66, 93], [96, 80], [96, 52], [66, 48]];
const D: [Pt, Pt, Pt, Pt] = [[66, 48], [36, 44], [36, 20], [66, 7]];

const SEAM_D =
  "M 34,7 C 4,20 4,48 34,52 C 64,56 64,82 34,93 " +
  "M 66,93 C 96,80 96,52 66,48 C 36,44 36,20 66,7";

const STITCH_COUNT = 5; // per Bézier segment
const INNER = 3;        // SVG units from seam centre to near end of bar
const OUTER = 8;        // SVG units from seam centre to far end of bar

// Pre-compute all stitch marks (static — same for every instance)
const ALL_STITCHES: StitchMark[] = [
  ...genStitches(...A, STITCH_COUNT, INNER, OUTER),
  ...genStitches(...B, STITCH_COUNT, INNER, OUTER),
  ...genStitches(...C, STITCH_COUNT, INNER, OUTER),
  ...genStitches(...D, STITCH_COUNT, INNER, OUTER),
];

// ── Component ────────────────────────────────────────────────────────────────

interface BaseballIconProps {
  /** Rendered pixel size (viewBox is always 100×100). */
  size?: number;
  className?: string;
  /** Clockwise rotation of the seam pattern in degrees (default 30). */
  rotation?: number;
}

export function BaseballIcon({ size = 24, className, rotation = 30 }: BaseballIconProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `bb-clip-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Clip to the ball circle so rotated seam paths don't bleed outside */}
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      {/* Ball */}
      <circle cx="50" cy="50" r="46" fill="white" stroke="#d1d5db" strokeWidth="1" />

      {/* Seams + stitches — rotate the pattern for visual interest */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={`rotate(${rotation} 50 50)`}>
          {/* Seam curves */}
          <path
            d={SEAM_D}
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Stitch marks: two short perpendicular bars on each side of the seam */}
          {ALL_STITCHES.map((s, i) => (
            <g key={i} stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
              <line x1={s.ax1} y1={s.ay1} x2={s.ax2} y2={s.ay2} />
              <line x1={s.bx1} y1={s.by1} x2={s.bx2} y2={s.by2} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
