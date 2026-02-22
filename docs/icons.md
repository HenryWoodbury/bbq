# Icons

## Baseball Icon

### Background

The original `public/icon.svg` was a placeholder — four colored quadrants with no actual baseball artwork. A proper baseball SVG was needed for the Leagues dropdown menu with the potential to be used at larger sizes throughout the app.

### Design decisions

A real baseball has two identical S-curve seam paths 180° apart, each with evenly spaced perpendicular stitches. The seam curves follow a geodesic path on a sphere, not simple arcs.

| Approach | Effort | Result |
|---|---|---|
| Simplified S-curve seams (cubic béziers, eyeballed) | Low | Looks like a baseball, not quite anatomically correct |
| Mathematically accurate seams (geodesic projected onto a circle) | Medium | Correct seam path, looks professional |
| Tilted 3D perspective with shading | Medium-High | Realistic, interesting angle |

The medium approach was chosen: mathematically placed seam curves and stitches, with the seam pattern rotated 30° for visual interest.

**Spec:** white ball, red stitching (`#dc2626`). The favicon (`public/icon.svg`) was left unchanged.

### Implementation

**File:** `src/components/icons/baseball-icon.tsx`

The component is a `"use client"` React SVG component. Key implementation notes:

- **Seam geometry** — two cubic Bézier S-curves in portrait orientation (circle r=46, centred at 50,50), rotated via SVG `transform`. Seam 2 is a 180° point-rotation of Seam 1 around the centre `(x,y) → (100-x, 100-y)`.
- **Stitch placement** — at each of 5 sample points per Bézier segment, the curve tangent is computed analytically, the normal is taken, and two short bars are drawn on each side of the seam (paired bars, not crossing lines).
- **Stitch pre-computation** — all 40 stitch marks (`5 samples × 4 segments × 2 sides`) are computed once at module load, with no per-render cost.
- **ClipPath** — seam paths near the ball edge can stray slightly outside the circle after rotation; a `<clipPath>` tied to the ball circle keeps them clean. `useId()` ensures the clip ID is unique per instance.
- **`rotation` prop** — defaults to 30°, adjustable. Try 15–45° for different feels.
- **Scaling** — the 100×100 viewBox keeps all math in round numbers; the `size` prop controls rendered pixels.

### Usage

```tsx
import { BaseballIcon } from "@/components/icons/baseball-icon";

<BaseballIcon size={16} />   // menu / inline
<BaseballIcon size={48} />   // larger contexts
<BaseballIcon size={16} rotation={45} />  // custom rotation
```

### Current usage

| Location | Size | Notes |
|---|---|---|
| `LeagueSelector` dropdown trigger | 15px | Replaces a hand-rolled inline SVG |
