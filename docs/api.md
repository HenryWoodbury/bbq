# API Routes

> **Type:** reference &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14 against `src/app/api/**/route.ts`

## Goal
Expose the player/stat/league/team data and the admin data-management
operations over HTTP, with every handler guarded so callers only reach what
their role permits. This catalogs all **29 route files** and the guard each uses.

## Auth levels & guards
Guards live in `src/lib/auth-helpers.ts` (see [auth.md](auth.md)). Within a single
route file, **read methods** typically call `auth.protect()` (any signed-in user)
while **write methods** add a stronger guard.

| Level | Guard | Who |
|---|---|---|
| authenticated | `auth.protect()` | any signed-in Clerk user |
| league member | `getLeagueRole` / `assertLeagueRole([...])` | member of the target league |
| commissioner | `assertLeagueRole([COMMISSIONER, CO_COMMISSIONER])` | league admins |
| admin | `assertAdmin()` | Clerk `publicMetadata.role = "admin"` |

---

## Players & Stats

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/players` | authenticated | List players (params: `search`, `position`, `page`, `limit`) |
| `POST` | `/api/players` | admin | Create a player |
| `GET` | `/api/players/[id]` | authenticated | Get one player |
| `PATCH` | `/api/players/[id]` | admin | Update player fields |
| `DELETE` | `/api/players/[id]` | admin | Soft-delete a player |
| `POST` | `/api/players/import` | admin | Import players from CSV (SFBB format) |
| `GET` | `/api/player-stats` | authenticated | List stats (params: `playerId`, `season`) |
| `POST` | `/api/player-stats` | admin | Create/upsert a `PlayerStat` |
| `GET` | `/api/player-stats/[id]` | authenticated | Get one stat row |
| `PATCH` | `/api/player-stats/[id]` | admin | Update a stat row |
| `DELETE` | `/api/player-stats/[id]` | admin | Soft-delete a stat row |
| `GET` | `/api/stat-definitions` | authenticated | List stat definitions |
| `POST` | `/api/stat-definitions` | admin | Create a stat definition |
| `GET` | `/api/stat-definitions/[id]` | authenticated | Get one stat definition |
| `PATCH` | `/api/stat-definitions/[id]` | admin | Update a stat definition |
| `DELETE` | `/api/stat-definitions/[id]` | admin | Soft-delete a stat definition |

---

## Leagues & Teams

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/leagues` | authenticated | List leagues the caller belongs to |
| `POST` | `/api/leagues` | authenticated | Create a league for the active Clerk org (`orgId` required) |
| `GET` | `/api/leagues/[id]` | league member | Get a league |
| `PATCH` | `/api/leagues/[id]` | commissioner | Update league name, format, or seasons |
| `DELETE` | `/api/leagues/[id]` | commissioner | Soft-delete league |
| `GET` | `/api/teams` | league member | List teams (param: `leagueId`) |
| `POST` | `/api/teams` | commissioner | Create a team |
| `GET` | `/api/teams/[id]` | league member | Get a team |
| `PATCH` | `/api/teams/[id]` | commissioner | Update team fields |
| `DELETE` | `/api/teams/[id]` | commissioner | Soft-delete team |

---

## Admin — Player data

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/admin/sync-players` | admin | Fetch SFBB Player ID Map and upsert players (logs a `PlayerMapImport`) |
| `DELETE` | `/api/admin/player-map-uploads/[id]` | admin | Delete a player-map import audit row |
| `POST` | `/api/admin/upload-universe` | admin | Upload Ottoneu universe CSV → `PlayerUniverse` (logs `PlayerUniverseUpload`) |
| `DELETE` | `/api/admin/player-universe-uploads/[id]` | admin | Delete a universe upload audit row |
| `GET` | `/api/admin/players/universe-search` | admin | Search `PlayerUniverse` by name/ID |
| `POST` | `/api/admin/players/manual` | admin | Create a manual player (`PlayerOverride`) |
| `PATCH` | `/api/admin/players/manual/[id]` | admin | Update a manual player |
| `DELETE` | `/api/admin/players/manual/[id]` | admin | Delete a manual player |
| `POST` | `/api/admin/players/[id]/override` | admin | Create/set an override for a player |
| `DELETE` | `/api/admin/players/[id]/override` | admin | Clear a player override |

---

## Admin — Stats

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/admin/upload-stats` | admin | Upload a projection/actuals CSV → `PlayerStat` (logs `StatUpload`) |
| `DELETE` | `/api/admin/stat-uploads/[id]` | admin | Delete a stat-upload audit row |

---

## Admin — League Formats

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/league-formats` | admin | List league formats |
| `POST` | `/api/admin/league-formats` | admin | Create a league format |
| `GET` | `/api/admin/league-formats/[id]` | admin | Get a league format |
| `PATCH` | `/api/admin/league-formats/[id]` | admin | Update a league format |
| `DELETE` | `/api/admin/league-formats/[id]` | admin | Soft-delete a league format |

> **Reconciliation note:** these routes are `league-formats`, not the previously
> documented `league-templates`. See [formats.md](formats.md).

---

## Admin — Parks, Visualization & Export

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/park-factors/sync` | admin | List park-factor sync audit rows |
| `POST` | `/api/admin/park-factors/sync` | admin | Sync park factors for a season/side/window (logs `ParkFactorSync`) |
| `DELETE` | `/api/admin/park-factors/sync` | admin | Delete a park-factor sync row |
| `POST` | `/api/admin/heat-maps` | admin | Create a heat-map colour scale |
| `PATCH` | `/api/admin/heat-maps/[id]` | admin | Update a heat map |
| `DELETE` | `/api/admin/heat-maps/[id]` | admin | Delete a heat map |
| `GET` | `/api/admin/data-exports` | admin | List export templates |
| `POST` | `/api/admin/data-exports` | admin | Create an export template |
| `PATCH` | `/api/admin/data-exports/[id]` | admin | Update an export template |
| `DELETE` | `/api/admin/data-exports/[id]` | admin | Soft-delete an export template |
| `GET` | `/api/admin/export/batcast` | admin | Generate a Batcast-format export file |

See [parks.md](parks.md), [heat-maps.md](heat-maps.md), [data-exports.md](data-exports.md).

---

## Response Conventions
- Success: `200 OK` (GET/PATCH), `201 Created` (POST), `204 No Content` (DELETE).
- Paginated lists: `{ data: T[], total, page, limit }`.
- Errors: `{ error: string }` with the appropriate HTTP status (401 unauthenticated,
  403 forbidden, 404 not found, 400 validation).
- Soft deletes set `deletedAt`; deleted rows are excluded from reads via `where: { deletedAt: null }`.

## Next / Open questions
- Read vs. write auth split is inferred from the guards present in each file; if a
  handler's role set changes, update the table in the same PR.
- No public/league-scoped route yet exposes parks/heat-maps/exports to non-admins.
