# Parks & Park Factors

> **Type:** spec &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14

## Goal
The system must provide **park-adjusted context** for player evaluation: how much
a given MLB venue inflates or suppresses outcomes (wOBA, HR, doubles, …), broken
out by batter side and smoothed over rolling multi-year windows. This lets stats
be read in light of where they were (or will be) produced.

## Invariants & constraints
- A `Park` is identified by its MLB `venueId` (**unique**).
- A `ParkFactor` is unique per `(parkId, season, batSide, rolling)` — one row per
  venue × season × side × window.
- `batSide` is `"R"`, `"L"`, or `""` (both sides combined).
- `rolling` is a year window: `1`, `3`, or `5`.
- Factor values are **indexes where 100 = neutral** (e.g. `"index_HR": 108` = 8%
  above average), stored as JSONB so the metric set can grow without a migration.

## Capability — sync park factors
- **Goal:** an admin can pull park-factor data for a season/side/window and upsert it.
- **Acceptance:** `POST /api/admin/park-factors/sync` upserts `ParkFactor` rows and
  writes one `ParkFactorSync` audit row (`total`, `upserted`); `GET` lists prior
  syncs; `DELETE` removes a sync audit row. (See [api.md](api.md).)
- **Realization:** `src/app/api/admin/park-factors/sync/route.ts`;
  computation/normalization helpers in `src/lib/park-factors.ts`
  (covered by `src/lib/park-factors.test.ts`).

## Capability — browse parks & factors
- **Goal:** an admin can review venues and their factor tables.
- **Acceptance:** the parks admin page renders parks with their factor rows by
  side and window.
- **Realization:** `src/app/admin/parks/page.tsx`,
  `src/app/admin/parks/park-page-tabs.tsx`,
  `src/app/admin/parks/park-factors-section.tsx`.

## Current realization (map)
- **Models:** `Park`, `ParkFactor`, `ParkFactorSync` (see [schema.md](schema.md)).
- **Routes:** `GET|POST|DELETE /api/admin/park-factors/sync`.
- **Logic:** `src/lib/park-factors.ts`.
- **UI:** `src/app/admin/parks/**`.

## Next / Open questions
- **Consumption** — park factors are not yet wired into a neutralized-stat
  pipeline (`PlayerStat.neutralized` exists; the adjustment step is not built).
- **Upstream source** — the authoritative source/cadence for the sync is not
  documented here. Rationale: TBD.
