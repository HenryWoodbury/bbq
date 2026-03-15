# Database Schema Reference

## Model Reference

### `Player`

Canonical player record. Source of truth is the Smart Fantasy Baseball (SFBB) player map.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `sfbbId` | `String` | No | SFBB `PLAYERID` column. Unique. Primary external key. |
| `playerName` | `String` | No | Display name from SFBB |
| `fgSpecialChar` | `String` | Yes | Name with diacritics (SFBB `FGSPECIALCHAR`). Preferred display name when present. |
| `positions` | `String[]` | No | Eligible positions, e.g. `["C","1B"]`. Parsed from SFBB CSV delimiters. |
| `team` | `String` | Yes | MLB team abbreviation, e.g. `"LAD"`, `"FA"` |
| `mlbLevel` | `String` | Yes | League level: `"MLB"`, `"AAA"`, `"AA"`, etc. |
| `active` | `Boolean` | No | Fantasy-relevant per SFBB (`ACTIVE = "Y"`). Default `true`. |
| `birthday` | `Date` | Yes | |
| `firstName` | `String` | Yes | |
| `lastName` | `String` | Yes | |
| `bats` | `String` | Yes | `"L"`, `"R"`, or `"S"` |
| `throws` | `String` | Yes | `"L"` or `"R"` |
| `mlbamId` | `Int` | Yes | MLBAM ID (`MLBID`). Indexed. |
| `fangraphsId` | `String` | Yes | FanGraphs ID (`IDFANGRAPHS`). Numeric string for MLB, `"sa…"` prefix for minors. Indexed. |
| `cbsId` | `Int` | Yes | CBS ID |
| `espnId` | `Int` | Yes | ESPN ID |
| `yahooId` | `Int` | Yes | Yahoo ID |
| `fantraxId` | `String` | Yes | Fantrax ID |
| `retroId` | `String` | Yes | Retrosheet ID |
| `nfbcId` | `Int` | Yes | NFBC ID |
| `bRefId` | `String` | Yes | Baseball Reference ID |
| `ottoneuId` | `Int` | Yes | Ottoneu ID |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

### `PlayerUniverse`

Format-specific player records (e.g., Ottoneu) linked back to canonical `Player`.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `format` | `String` | No | Format key, e.g. `"ottoneu"` |
| `ottoneuId` | `Int` | No | Platform player ID |
| `playerName` | `String` | No | Platform display name |
| `positions` | `String[]` | No | Format-specific positions |
| `fangraphsId` | `String` | Yes | Used for reconciliation |
| `mlbamId` | `Int` | Yes | Used for reconciliation |
| `birthday` | `Date` | Yes | |
| `playerId` | `String` | Yes | FK → `Player.id`. Null if not yet linked. |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

Composite unique: `(format, ottoneuId)`.

### `PlayerOverride`

Manual overrides for display names, attributes, and manual player additions.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `playerId` | `String` | Yes | FK → `Player.id`. Unique. Null for manual players not yet in SFBB. |
| `isManual` | `Boolean` | No | True = manually added. Stays true even after auto-linking. Default `false`. |
| `fangraphsId` | `String` | Yes | Dedup matching during sync/upload |
| `mlbamId` | `Int` | Yes | Dedup matching during sync/upload |
| `ottoneuId` | `Int` | Yes | |
| `displayName` | `String` | Yes | Override — null = use `Player.playerName` |
| `firstName` | `String` | Yes | Override |
| `lastName` | `String` | Yes | Override |
| `nickname` | `String` | Yes | |
| `birthday` | `Date` | Yes | Override |
| `team` | `String` | Yes | Override |
| `mlbLevel` | `String` | Yes | Override |
| `active` | `Boolean` | Yes | Override |
| `bats` | `String` | Yes | Override |
| `throws` | `String` | Yes | Override |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

### `StatDefinition`

Catalog of scoring stat definitions. 41 batter stats, 33 pitcher stats.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `abbreviation` | `String` | No | e.g. `"HR"`, `"ERA"` |
| `playerType` | `StatPlayerType` | No | `BATTER` or `PITCHER` |
| `name` | `String` | Yes | Full name |
| `description` | `String` | Yes | |
| `format` | `String` | Yes | Format hint: `"integer"`, `"#.###"`, `"#.#%"` |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

Composite unique: `(abbreviation, playerType)`.

### `PlayerStat`

JSONB stats per player-season. Covers actuals, projections, neutralized projections, and splits.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `playerId` | `String` | No | FK → `Player.id` |
| `season` | `Int` | No | 4-digit year |
| `playerType` | `StatPlayerType` | No | `BATTER` or `PITCHER`. Default `BATTER`. |
| `projected` | `Boolean` | No | True = projection, false = actual. Default `false`. |
| `neutralized` | `Boolean` | No | True = park/environment neutralized. Default `false`. |
| `split` | `StatSplit` | No | See `StatSplit` enum. Default `None`. |
| `mlbTeam` | `String` | Yes | Team abbreviation at time of stat row |
| `stats` | `Json` | No | See JSONB Shapes below |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

Composite unique: `(playerId, season, playerType, projected, neutralized, split)`.

### `League`

One league per Clerk Organization — the multi-tenancy boundary.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `clerkOrgId` | `String` | No | Clerk Org ID. Unique. |
| `leagueName` | `String` | No | |
| `templateId` | `String` | Yes | FK → `LeagueTemplate.id`. Indexed. |
| `hostLeagueUrl` | `String` | Yes | URL to league on host platform |
| `seasons` | `Int[]` | No | Array of 4-digit years the league was active |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

### `LeagueMember`

Junction table: Clerk user → League with role. Composite PK.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `clerkUserId` | `String` | No | PK (part 1) |
| `leagueId` | `String` | No | PK (part 2). FK → `League.id`. Indexed. |
| `role` | `LeagueMemberRole` | No | See enum |
| `createdAt` | `DateTime` | No | When user joined the league. Default `now()`. |

### `LeagueTemplate`

Reusable format bundles that drive league configuration.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `name` | `String` | No | Human-readable name. Unique. |
| `platform` | `TemplatePlatform` | No | See enum |
| `playType` | `TemplatePlayType` | No | See enum |
| `scoring` | `TemplateScoring` | No | See enum |
| `draftMode` | `TemplateDraftMode` | No | See enum |
| `draftType` | `TemplateDraftType` | No | See enum |
| `teams` | `Int` | No | Number of teams. Default `12`. |
| `rosterSize` | `Int` | No | Total roster slots |
| `cap` | `Int` | Yes | Auction salary cap per team. Null for snake drafts. Typical: 400 (Ottoneu), 260 (ESPN/Custom auction). |
| `rosters` | `Json` | No | See JSONB Shapes below |
| `isActive` | `Boolean` | No | Default `true` |
| `version` | `Int` | No | Default `1` |
| `description` | `String` | Yes | |
| `rulesText` | `String` | Yes | |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

### `Team`

A team within a league.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `leagueId` | `String` | No | FK → `League.id`. Indexed (hot path). |
| `teamName` | `String` | No | |
| `currentRoster` | `Json` | No | See JSONB Shapes below. Default `{}`. |
| `financeData` | `Json` | No | See JSONB Shapes below. Default `{}`. |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

### `TeamManager`

Junction table: Clerk user → Team with primary flag. Composite PK.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `clerkUserId` | `String` | No | PK (part 1) |
| `teamId` | `String` | No | PK (part 2). FK → `Team.id`. Indexed. |
| `isPrimary` | `Boolean` | No | True = primary manager. Default `true`. |
| `createdAt` | `DateTime` | No | When manager was added. Default `now()`. |

### `RosterHistory`

Immutable cut event log: one row per player removed from a team.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String` (UUID) | No | PK |
| `teamId` | `String` | No | FK → `Team.id`. Indexed. |
| `playerId` | `String` | No | FK → `Player.id`. Indexed. |
| `salaryAtCut` | `Int` | Yes | Whole-dollar salary at time of cut |
| `cutDate` | `DateTime` | No | Default `now()` |
| `createdAt` | `DateTime` | No | |
| `updatedAt` | `DateTime` | No | Auto-updated |
| `deletedAt` | `DateTime` | Yes | Soft-delete |

---

## JSONB Shapes

### `PlayerStat.stats`

Keyed by `StatDefinition.abbreviation`. Values are numbers.

```json
{
  "HR": 40,
  "AVG": 0.300,
  "ERA": 3.15,
  "K%": 0.285
}
```

Only keys relevant to the `playerType` (BATTER or PITCHER) will be present.

### `Team.currentRoster`

Slot names match `LeagueTemplate.rosters`. Values are `Player.id` UUIDs or `null` for empty slots. Suffixed slots (`_1`, `_2`) are used when the same position appears multiple times.

```json
{
  "C": "uuid-or-null",
  "1B": "uuid-or-null",
  "OF_1": "uuid-or-null",
  "OF_2": "uuid-or-null",
  "OF_3": "uuid-or-null",
  "P_1": "uuid-or-null",
  "BN_1": "uuid-or-null"
}
```

### `Team.financeData`

All values in whole dollars.

```json
{
  "loans_in": 0,
  "loans_out": 0,
  "budget": 400,
  "spent": 245
}
```

### `LeagueTemplate.rosters`

Ordered array of roster slot position names. Determines the shape of `Team.currentRoster`.

```json
["C", "1B", "2B", "3B", "SS", "OF", "OF", "OF", "Util", "SP", "SP", "RP", "RP", "P", "BN", "BN", "BN", "IL"]
```

---

## Enums

### `StatPlayerType`

| Value | Meaning |
|---|---|
| `BATTER` | Batting stat definition or row |
| `PITCHER` | Pitching stat definition or row |

### `StatSplit`

| Prisma value | DB value | Meaning |
|---|---|---|
| `None` | `none` | No split — full season |
| `VsLeft` | `vs_left` | Stats vs. LHP |
| `VsRight` | `vs_right` | Stats vs. RHP |

### `LeagueMemberRole`

| Value | Meaning |
|---|---|
| `COMMISSIONER` | Full league admin rights |
| `CO_COMMISSIONER` | Shared admin rights |
| `MANAGER` | Team manager |
| `CO_MANAGER` | Secondary team manager |
| `ONLOOKER` | Read-only member |

### `TemplatePlatform`

| Prisma value | DB value |
|---|---|
| `ESPN` | `ESPN` |
| `Ottoneu` | `Ottoneu` |
| `Custom` | `Custom` |

### `TemplatePlayType`

| Prisma value | DB value | Meaning |
|---|---|---|
| `H2H` | `H2H` | Head-to-head matchups |
| `Season` | `Season` | Full-season rotisserie |

### `TemplateScoring`

| Prisma value | DB value | Meaning |
|---|---|---|
| `FiveX5` | `5x5` | Rotisserie 5×5 |
| `FourX4` | `4x4` | Rotisserie 4×4 |
| `Fangraphs` | `fangraphs` | FanGraphs linear-weights points |
| `SABR` | `sabr` | SABR linear-weights points |
| `Points` | `points` | Platform-native points (e.g. ESPN) |

### `TemplateDraftMode`

| Prisma value | DB value | Meaning |
|---|---|---|
| `Live` | `live` | Synchronous live draft |
| `Slow` | `slow` | Async slow draft |

### `TemplateDraftType`

| Prisma value | DB value | Meaning |
|---|---|---|
| `Snake` | `snake` | Snake draft order |
| `Auction` | `auction` | Salary auction draft |

---

## Indexes

| Table | Index | Type | Purpose |
|---|---|---|---|
| `players` | `positions` | GIN | Array element search (`@>`, `&&`) |
| `players` | `fangraphs_id` | B-tree | Cross-ref lookup in reconcile/sync |
| `players` | `mlbam_id` | B-tree | Cross-ref lookup in reconcile/sync |
| `player_universe` | `player_id` | B-tree | Reverse lookup: universes for a player |
| `player_universe` | `(format, ottoneu_id)` | Unique | Dedup on upsert |
| `player_overrides` | `player_id` | Unique | One override per canonical player |
| `stat_definitions` | `(abbreviation, player_type)` | Unique | Dedup on upsert |
| `leagues` | `clerk_org_id` | Unique | Clerk org lookup |
| `leagues` | `template_id` | B-tree | Reverse lookup: leagues using a template |
| `league_members` | `league_id` | B-tree | List all members of a league (PK starts with `clerk_user_id`) |
| `teams` | `league_id` | B-tree | List teams per league — very hot path |
| `team_managers` | `team_id` | B-tree | List managers of a team (PK starts with `clerk_user_id`) |
| `roster_history` | `team_id` | B-tree | Team's full cut history |
| `roster_history` | `player_id` | B-tree | Player's cut history across teams |
| `player_stats` | `(player_id, season, player_type, projected, neutralized, split)` | Unique | Dedup on upsert |

---

## Referential Actions

| FK | `onDelete` | `onUpdate` | Implication |
|---|---|---|---|
| `PlayerUniverse.playerId → Player` | `SetNull` | `Cascade` | Unlinking a player keeps the universe row |
| `PlayerOverride.playerId → Player` | `SetNull` | `Cascade` | Unlinking a player keeps the override |
| `PlayerStat.playerId → Player` | `Restrict` (default) | `Cascade` | Cannot delete a player with stat rows |
| `League.templateId → LeagueTemplate` | `SetNull` | `Cascade` | Deleting a template detaches leagues |
| `LeagueMember.leagueId → League` | `Restrict` (default) | `Cascade` | Must remove members before deleting league |
| `Team.leagueId → League` | `Restrict` (default) | `Cascade` | Must remove teams before deleting league |
| `TeamManager.teamId → Team` | `Restrict` (default) | `Cascade` | Must remove managers before deleting team |
| `RosterHistory.teamId → Team` | `Restrict` (default) | `Cascade` | History rows block team deletion |
| `RosterHistory.playerId → Player` | `Restrict` (default) | `Cascade` | History rows block player deletion |

> **Note on soft-delete**: Most models have `deletedAt`. Soft-deleted records are retained in the DB, so FK restrictions only apply to hard deletes. All queries must filter `deletedAt: null`.

---

## Composite PKs

`LeagueMember` and `TeamManager` use composite PKs with the Clerk user ID as the first component:

- `LeagueMember(clerkUserId, leagueId)` — a user can be in many leagues; a league has many members
- `TeamManager(clerkUserId, teamId)` — a user can manage many teams; a team has many managers

Because Postgres auto-indexes only the full composite PK (leading column first), querying by the trailing FK column (`leagueId`, `teamId`) requires an explicit index — both are present.

---

## Soft-Delete Pattern

Most models carry `deletedAt DateTime?`. Records are never hard-deleted in application code — they are soft-deleted by setting `deletedAt = now()`.

**All queries must filter `deletedAt: null` (or `deletedAt: { equals: null }` in Prisma).** Omitting this filter will return deleted records.

Hard deletes are only used during database resets in development.

---

## Security

No database-level RLS. Security is enforced at the application layer:

1. **Route protection** — Clerk middleware (`src/proxy.ts`) guards all non-public routes
2. **API auth** — `await auth.protect()` in each API route handler
3. **Data scoping** — Queries scoped by `orgId` (league) and `clerkUserId` (member/manager)
4. **Admin guard** — `assertAdmin()` in `src/lib/auth-helpers.ts` checks `sessionClaims.metadata.role === "admin"`

RLS is planned for Beta/RC stages as defense-in-depth.

---

## Gaps / Planned (Not Yet Implemented)

- `transactions` table (trade/FAAB transaction history) — see `rules.md`
- Check constraints for enum-like string fields (`bats`, `throws`, position strings) — currently enforced at the application layer only
