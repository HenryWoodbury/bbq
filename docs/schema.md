# Database Schema Reference

> **Type:** reference &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14 against `prisma/schema.prisma`

## Goal
The system must hold a canonical, reconciled view of the baseball player pool
(identity, stats, park context) plus per-league tenant state (teams, rosters,
finance, membership), so leagues can prepare for and run a draft. This file maps
every model, enum, and JSONB shape to that goal. It is the source-of-truth
reference for [overview.md](overview.md)'s five domains.

**17 models across 5 domains.** Names below match `prisma/schema.prisma` exactly.

---

## Domain 1 — Player Universe & Stats

### `Player`
Canonical player identity. Source of truth is the Smart Fantasy Baseball (SFBB)
player map. Carries cross-reference IDs for 9+ external systems so any source can
be reconciled to one record.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `sfbbId` | String | No | SFBB `PLAYERID`. **Unique.** Primary external key. |
| `playerName` | String | No | Display name from SFBB |
| `fgSpecialChar` | String | Yes | Name with diacritics (`FGSPECIALCHAR`). Preferred display when present. |
| `positions` | String[] | No | Eligible positions, e.g. `["C","1B"]`. GIN-indexed. |
| `team` | String | Yes | MLB team abbr, e.g. `"LAD"`, `"FA"` |
| `mlbLevel` | String | Yes | `"MLB"`, `"AAA"`, … |
| `active` | Boolean | No | Fantasy-relevant per SFBB (`ACTIVE = "Y"`). Default `true`. |
| `birthday` | Date | Yes | |
| `firstName` / `lastName` | String | Yes | |
| `bats` | String | Yes | `"L"`, `"R"`, `"S"` |
| `throws` | String | Yes | `"L"`, `"R"` |
| `mlbamId` | Int | Yes | `MLBID`. Indexed. |
| `fangraphsId` | String | Yes | `IDFANGRAPHS`. Numeric, or `"sa…"` for minors. Indexed. |
| `cbsId` `espnId` `yahooId` `nfbcId` | Int | Yes | Platform IDs |
| `fantraxId` `retroId` `bRefId` | String | Yes | Platform IDs |
| `ottoneuId` | Int | Yes | Ottoneu ID. Indexed. |
| `createdAt` / `updatedAt` / `deletedAt` | DateTime | — | Timestamps; `deletedAt` soft-delete |

Relations: `stats[]`, `rosterHistory[]`, `universe[]`, `override?`.

### `PlayerUniverse`
Format-specific player records (currently Ottoneu) linked back to canonical `Player`.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `format` | String | No | Format key, e.g. `"ottoneu"` |
| `ottoneuId` | Int | No | Platform player ID |
| `playerName` | String | No | Platform display name |
| `positions` | String[] | No | Format-specific positions |
| `fangraphsId` | String | Yes | Reconciliation key |
| `mlbamId` | Int | Yes | Reconciliation key |
| `birthday` | Date | Yes | |
| `playerId` | String | Yes | FK → `Player.id`. Null until linked. |
| timestamps | | | incl. `deletedAt` |

Composite unique: `(format, ottoneuId)`.

### `PlayerOverride`
Manual overrides for display/attributes, and the anchor for manually-added players.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `playerId` | String | Yes | FK → `Player.id`. **Unique.** Null for manual players not yet in SFBB. |
| `isManual` | Boolean | No | True = manually added. Stays true after auto-linking. |
| `fangraphsId` `mlbamId` `ottoneuId` | — | Yes | Dedup matching during sync/upload |
| `displayName` `firstName` `lastName` `nickname` | String | Yes | Display overrides — null = use canonical `Player` field |
| `birthday` `team` `mlbLevel` `league` `active` `bats` `throws` | — | Yes | Attribute overrides |
| `positions` | String[] | No | Position override (default `[]`) |
| timestamps | | | incl. `deletedAt` |

### `StatDefinition`
Catalog of scoring stats. ~41 batter + ~33 pitcher definitions seeded.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `abbreviation` | String | No | e.g. `"HR"`, `"ERA"` |
| `playerType` | `StatPlayerType` | No | `BATTER` or `PITCHER` |
| `name` | String | Yes | Full name |
| `description` | String | Yes | |
| `format` | String | Yes | Display hint: `"integer"`, `"#.###"`, `"#.#%"` |
| timestamps | | | incl. `deletedAt` |

Composite unique: `(abbreviation, playerType)`.

### `PlayerStat`
JSONB stats per player-season. One row per unique combination of
season × type × projection source × neutralized × split × rest-of-season.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `playerId` | String | No | FK → `Player.id` |
| `season` | Int | No | 4-digit year |
| `playerType` | `StatPlayerType` | No | Default `BATTER` |
| `projection` | `StatProjection` | No | Projection source (`None` = actuals). Default `None`. |
| `neutralized` | Boolean | No | True = park/environment neutralized. Default `false`. |
| `split` | `StatSplit` | No | Default `None` |
| `ros` | Boolean | No | True = rest-of-season figures. Default `false`. |
| `mlbTeam` | String(10) | Yes | Team abbr at time of stat row |
| `stats` | Json | No | JSONB keyed by `StatDefinition.abbreviation`. See below. |
| timestamps | | | incl. `deletedAt` |

Composite unique: `(playerId, season, playerType, projection, neutralized, split, ros)`.
Index: `(season, playerType, projection, split, ros)`.

> **Reconciliation note:** earlier docs described a boolean `projected` and a
> shorter unique key. The schema now uses the `StatProjection` enum plus a `ros`
> flag and `mlbTeam`; the unique key includes both. Document and code agree as of
> this reconciliation.

### Audit / import-tracking models
Thin append-style records that capture the result of each bulk operation.

| Model | PK | Key fields | Purpose |
|---|---|---|---|
| `StatUpload` | cuid | `season, playerType, projection, split, ros` (unique); `fileName, total, linked, skipped, upserted` | One row per stat-file upload |
| `PlayerMapImport` | cuid | `season, fileName, total, inserted, updated, deleted` | One row per SFBB player-map sync |
| `PlayerUniverseUpload` | cuid | `season, fileName, total, inserted, updated, deleted` | One row per Ottoneu universe upload |

These have no `deletedAt` — they are immutable audit rows.

---

## Domain 2 — Leagues, Teams & Roster (Clerk-linked)

### `League`
One league per Clerk Organization — the tenancy boundary.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `clerkOrgId` | String | No | Clerk Org ID. **Unique.** |
| `leagueName` | String | No | |
| `formatId` | String | Yes | FK → `LeagueFormat.id`. Indexed. |
| `hostLeagueUrl` | String | Yes | Deep link to the league on its host platform |
| `seasons` | Int[] | No | 4-digit years the league was active |
| timestamps | | | incl. `deletedAt` |

Relations: `members[]`, `teams[]`, `format?`.

> **Reconciliation note:** the FK is `formatId → LeagueFormat`, **not**
> `templateId → LeagueTemplate`. The "template" naming is retired everywhere.

### `LeagueMember`
Junction: Clerk user → League with role. Composite PK `(clerkUserId, leagueId)`.

| Field | Type | Null | Notes |
|---|---|---|---|
| `clerkUserId` | String | No | PK part 1 |
| `leagueId` | String | No | PK part 2. FK → `League.id`. Indexed. |
| `role` | `LeagueMemberRole` | No | |
| `createdAt` / `deletedAt` | DateTime | — | |

### `Team`
A team within a league. Roster and finances are JSONB.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `leagueId` | String | No | FK → `League.id`. Indexed (hot path). |
| `teamName` | String | No | |
| `currentRoster` | Json | No | Slot → `Player.id` map. Default `{}`. |
| `financeData` | Json | No | Whole-dollar finance object. Default `{}`. |
| timestamps | | | incl. `deletedAt` |

### `TeamManager`
Junction: Clerk user → Team. Composite PK `(clerkUserId, teamId)`.

| Field | Type | Null | Notes |
|---|---|---|---|
| `clerkUserId` | String | No | PK part 1 |
| `teamId` | String | No | PK part 2. FK → `Team.id`. Indexed. |
| `isPrimary` | Boolean | No | Default `true` |
| `createdAt` / `deletedAt` | DateTime | — | |

### `RosterHistory`
Immutable cut-event log: one row per player removed from a team.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `teamId` | String | No | FK → `Team.id`. Indexed. |
| `playerId` | String | No | FK → `Player.id`. Indexed. |
| `salaryAtCut` | Int | Yes | Whole-dollar salary at cut |
| `cutDate` | DateTime | No | Default `now()` |
| timestamps | | | incl. `deletedAt` |

---

## Domain 3 — League Formats

### `LeagueFormat`
Reusable format bundle that configures a league (platform × play-type × scoring ×
draft × roster shape). See [formats.md](formats.md) for the 12 seeded formats.

| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `name` | String | No | **Unique.** Human-readable. |
| `platform` | `FormatPlatform` | No | |
| `playType` | `FormatPlayType` | No | |
| `scoring` | `FormatScoring` | No | |
| `draftMode` | `FormatDraftMode` | No | |
| `draftType` | `FormatDraftType` | No | |
| `teams` | Int | No | Default `12` |
| `rosterSize` | Int | No | Total roster slots |
| `cap` | Int | Yes | Auction salary cap; null for snake |
| `rosters` | Json | No | Ordered array of roster slot positions |
| `isActive` | Boolean | No | Default `true` |
| `version` | Int | No | Default `1` |
| `description` | String | Yes | |
| `rulesText` | String | Yes | Markdown rules summary |
| timestamps | | | incl. `deletedAt` |

---

## Domain 4 — Parks & Factors
See [parks.md](parks.md) for the capability spec.

### `Park`
| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `venueId` | Int | No | MLB venue ID. **Unique.** |
| `venueName` | String | No | |
| `teamName` | String | Yes | |
| timestamps | | | incl. `deletedAt` |

Relation: `factors[]`.

### `ParkFactor`
| Field | Type | Null | Notes |
|---|---|---|---|
| `id` | UUID | No | PK |
| `parkId` | String | No | FK → `Park.id` |
| `season` | Int | No | |
| `batSide` | String | No | `"R"`, `"L"`, or `""` (both) |
| `rolling` | Int | No | Window in years: 1, 3, or 5 |
| `factors` | Json | No | JSONB: `{ "index_wOBA": 100, "index_HR": 108, … }` |
| timestamps | | | incl. `deletedAt` |

Composite unique: `(parkId, season, batSide, rolling)`. Index: `(season, batSide, rolling)`.

### `ParkFactorSync`
Immutable audit row. PK cuid. Fields: `season, batSide, rolling, total, upserted, createdAt`.

---

## Domain 5 — Visualization & Export
See [heat-maps.md](heat-maps.md) and [data-exports.md](data-exports.md).

### `OklchColor`
A single OKLCH colour stop. PK `Int autoincrement`.

| Field | Type | Notes |
|---|---|---|
| `lightness` | Decimal(6,4) | |
| `chroma` | Decimal(6,4) | |
| `hue` | Decimal(8,4) | |
| `alpha` | Decimal(5,4) | Default `1` |

Referenced by `HeatMap` via six relations (min/avg/max × light/dark).

### `HeatMap`
A named colour scale for stat visualization, with separate light/dark stops.

| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK autoincrement |
| `name` | String | **Unique** |
| `min` / `max` / `avg` | Int | Domain endpoints + midpoint of the scale |
| `increments` | Int | Number of colour steps |
| `isPivot` | Boolean | When true, `avg` is the pivot: min hue for lower half, max hue for upper half. Default `false`. |
| `curve` | Float | Power-curve exponent k (`t' = t^(1/k)`). k=1 linear. Default `1`. |
| `curveDark` | Float | Dark-mode curve. Default `3`. |
| `minColorId` `avgColorId` `maxColorId` | Int | FKs → `OklchColor` (light) |
| `minDarkColorId` `avgDarkColorId` `maxDarkColorId` | Int | FKs → `OklchColor` (dark) |
| timestamps | | (no `deletedAt`) |

### `DataExport`
Named, ordered column template for outbound files.

| Field | Type | Notes |
|---|---|---|
| `id` | cuid | PK |
| `name` | String | **Unique** |
| `scope` | `ExportScope` | What the export is about |
| `type` | `ExportType` | Shape of the export |
| `fields` | String[] | Ordered field names included |
| timestamps | | incl. `deletedAt` |

---

## JSONB Shapes

### `PlayerStat.stats` — keyed by `StatDefinition.abbreviation`
```json
{ "HR": 40, "AVG": 0.300, "ERA": 3.15, "K%": 0.285 }
```
Only keys relevant to the `playerType` are present.

### `Team.currentRoster` — slot → `Player.id` (or `null`)
Slot names match `LeagueFormat.rosters`; repeated positions are suffixed `_1`, `_2`.
```json
{ "C": "uuid-or-null", "OF_1": "uuid-or-null", "P_1": "uuid-or-null", "BN_1": "uuid-or-null" }
```

### `Team.financeData` — whole dollars
```json
{ "loans_in": 0, "loans_out": 0, "budget": 400, "spent": 245 }
```

### `LeagueFormat.rosters` — ordered slot positions
```json
["C","1B","2B","3B","SS","OF","OF","OF","Util","SP","SP","RP","RP","P","BN","BN","BN","IL"]
```

### `ParkFactor.factors` — index values (100 = neutral)
```json
{ "index_wOBA": 100, "index_HR": 108, "index_3B": 121 }
```

---

## Enums

| Enum | Values (Prisma → DB) |
|---|---|
| `StatPlayerType` | `BATTER`, `PITCHER` |
| `StatSplit` | `None`→`none`, `Neutral`→`neutral`, `VsLeft`→`vs_left`, `VsRight`→`vs_right` |
| `StatProjection` | `None`, `ZiPS`, `Steamer`, `ATC`, `TheBat`, `TheBatX`, `OOPSY`, `DepthCharts`, `ZiPSDC`, `RoS` |
| `LeagueMemberRole` | `COMMISSIONER`, `CO_COMMISSIONER`, `MANAGER`, `CO_MANAGER`, `ONLOOKER` |
| `FormatPlatform` | `ESPN`, `Ottoneu`, `Custom` |
| `FormatPlayType` | `H2H`, `Season` |
| `FormatScoring` | `FiveX5`→`5x5`, `FourX4`→`4x4`, `Fangraphs`, `SABR`, `Points` |
| `FormatDraftMode` | `Live`, `Slow` |
| `FormatDraftType` | `Snake`, `Auction` |
| `ExportScope` | `Players`, `Teams`, `Leagues`, `Parks`, `Platform` |
| `ExportType` | `Standard`, `Splits`, `Profiles` |

---

## Conventions

### Soft delete
Most models carry `deletedAt DateTime?`. Application code never hard-deletes; it
sets `deletedAt = now()`. **Every read must filter `deletedAt: null`.** The audit
models (`StatUpload`, `PlayerMapImport`, `PlayerUniverseUpload`, `ParkFactorSync`)
and `HeatMap`/`OklchColor` have no `deletedAt`.

### Composite PKs
`LeagueMember(clerkUserId, leagueId)` and `TeamManager(clerkUserId, teamId)` lead
with the Clerk user ID. Postgres auto-indexes only the leading PK column, so the
trailing FK columns (`leagueId`, `teamId`) carry explicit indexes.

### Security
No DB-level RLS. Enforced at the app layer: Clerk middleware (`src/proxy.ts`),
per-route guards (`auth.protect()` / `assertAdmin()` / `assertLeagueRole()`), and
org/membership scoping. See [auth.md](auth.md). RLS deferred to Beta/RC.

---

## Next / Open questions (Gaps)
- **`transactions` table** (trade/FAAB history) — planned, not yet implemented.
- **Check constraints** for enum-like string fields (`bats`, `throws`, position
  strings, `ParkFactor.batSide`) — currently app-layer only.
- **RLS** — deferred to Beta/RC as defense-in-depth.
