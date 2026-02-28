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
// Derived from a real 3D baseball model (SketchUp/Collada), looking along the
// Y axis and projecting X→SVG-x, Z→SVG-y. Circle r=46 centred at (50,50).
//
// Each seam half is a single cubic Bézier fitted (least-squares, chord-length
// parameterisation) to 28 extracted stitch-centreline points. Seam 2 is an
// exact 180° point-rotation of Seam 1 around the ball centre (x,y)→(100-x,100-y).
//
// Seam 1 — C-curve bowing left:  (33,8) → left apex ≈ (20,58) → (52,90)
const S1: [Pt, Pt, Pt, Pt] = [[33.2, 7.8],  [18.3, 34.4], [6.2,  89.5], [51.7, 90.4]];
// Seam 2 — C-curve bowing right: (67,92) → right apex ≈ (80,42) → (48,10)
const S2: [Pt, Pt, Pt, Pt] = [[66.8, 92.2], [81.7, 65.6], [93.8, 10.5], [48.3,  9.6]];

const SEAM_D =
  "M 33.2,7.8 C 18.3,34.4 6.2,89.5 51.7,90.4 " +
  "M 66.8,92.2 C 81.7,65.6 93.8,10.5 48.3,9.6";

const STITCH_COUNT = 10; // per Bézier segment (one segment per seam half)
const INNER = 3;         // SVG units from seam centre to near end of bar
const OUTER = 8;         // SVG units from seam centre to far end of bar

// Pre-compute all stitch marks (static — same for every instance)
const ALL_STITCHES: StitchMark[] = [
  ...genStitches(...S1, STITCH_COUNT, INNER, OUTER),
  ...genStitches(...S2, STITCH_COUNT, INNER, OUTER),
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
