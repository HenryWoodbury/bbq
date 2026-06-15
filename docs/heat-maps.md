# Heat Maps & Colour Scales

> **Type:** spec &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14

## Goal
The system must turn a numeric stat domain into a **named, reusable colour scale**
so tables and visualizations can shade values consistently — with first-class
light and dark variants and a configurable response curve. A heat map maps a
`[min … avg … max]` domain to interpolated OKLCH colours.

## Invariants & constraints
- A `HeatMap.name` is **unique** (e.g. the seeded `"Default"`).
- Colours are stored in **OKLCH** as `OklchColor` rows; a heat map references six:
  `min/avg/max` for light mode and `minDark/avgDark/maxDark` for dark mode.
- `isPivot` controls interpolation: when true, `avg` is a pivot — the min hue
  drives the lower half of the domain, the max hue the upper half.
- `curve` / `curveDark` are power-curve exponents `k` (`t' = t^(1/k)`): `k=1` is
  linear; `k>1` spreads colour near the extremes. Dark mode defaults to a steeper
  curve (`3`).
- `increments` sets the number of discrete colour steps.

## Capability — interpolate a scale
- **Goal:** given a heat map and a value in `[min, max]`, produce the OKLCH colour
  for that value, honouring pivot and curve.
- **Acceptance:** the interpolation helpers return correct stops at `min`, `avg`,
  `max` and curve-adjusted intermediate values; covered by tests.
- **Realization:** `src/lib/heat-map.ts` and `src/lib/color.ts` (OKLCH math),
  with `src/lib/heat-map.test.ts` and `src/lib/color.test.ts`.

## Capability — author & manage heat maps
- **Goal:** an admin can create and edit heat maps and their colour stops.
- **Acceptance:** `POST /api/admin/heat-maps` creates a heat map with its six
  colour stops; `PATCH|DELETE /api/admin/heat-maps/[id]` edit/remove it.
- **Realization:** `src/app/api/admin/heat-maps/**`; colour picking via
  `src/components/ui/color-input.tsx`. A `"Default"` heat map is seeded
  (`seedHeatMaps` in `prisma/seed.ts`).

## Current realization (map)
- **Models:** `HeatMap`, `OklchColor` (see [schema.md](schema.md)).
- **Routes:** `POST /api/admin/heat-maps`, `PATCH|DELETE /api/admin/heat-maps/[id]`.
- **Logic:** `src/lib/heat-map.ts`, `src/lib/color.ts`.
- **UI / stories:** `src/components/ui/color-input.tsx`,
  `src/stories/foundations/colors.stories.tsx`.
- **Theming overlap:** OKLCH is also the basis of the app's theme tokens — see
  [theming.md](theming.md).

## Next / Open questions
- **Binding to data** — which tables/columns each heat map shades is driven in the
  UI; there is no persisted mapping of heat-map → stat column yet.
