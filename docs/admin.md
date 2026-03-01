# Admin

Fantasy baseball draft and league management. Multi-tenant via Clerk organizations — each league maps 1:1 to a Clerk org.

## Player Universe

Global data shared across all leagues. The canonical player registry is sourced from the [Smart Fantasy Baseball Player ID Map](https://www.smartfantasybaseball.com/PLAYERIDMAPCSV) — ~750 fantasy-relevant players updated infrequently. Admins trigger a remote sync via the Admin UI; CSV upload is available as a manual fallback.

### `players`

The canonical player registry. One row per real-world player. Keyed on SFBB's `PLAYERID`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated internal UUID. |
| `sfbb_id` | `varchar` UNIQUE | Smart Fantasy Baseball Player ID (`PLAYERID` column). Primary external key. |
| `player_name` | `text` | Full name (`PLAYERNAME`). Required. |
| `positions` | `text[]` | Eligible positions parsed from `POS` (e.g. `["SP","RP"]`, `["1B","3B"]`). |
| `team` | `varchar` | Current MLB team abbreviation, e.g. `"LAD"`, `"NYY"`, `"FA"`. Nullable. |
| `mlb_level` | `varchar` | League level from `LG` column: `"MLB"`, `"AAA"`, `"AA"`, etc. Nullable. |
| `active` | `boolean` | `true` when SFBB `ACTIVE = "Y"`. Defaults to `true`. |
| `birthday` | `date` | From `BIRTHDATE`. Nullable. |
| `mlbam_id` | `int` | MLB Advanced Media / Statcast ID (`MLBID`). Nullable. |
| `fangraphs_id` | `int` | FanGraphs major league ID (`IDFANGRAPHS`). Nullable. |
| `fangraphs_minors_id` | `varchar` | FanGraphs minor league ID (`FANGRAPHSMINORSID`). Nullable. |
| `cbs_id` | `int` | CBS Sports ID (`CBSID`). Nullable. |
| `espn_id` | `int` | ESPN ID (`ESPNID`). Nullable. |
| `yahoo_id` | `int` | Yahoo Fantasy ID (`YAHOOID`). Nullable. |
| `fantrax_id` | `varchar` | Fantrax ID (`FANTRAXID`). Nullable. |
| `retro_id` | `varchar` | Retrosheet ID (`RETROID`), e.g. `"ohtash001"`. Nullable. |
| `nfbc_id` | `int` | NFBC ID (`NFBCID`). Nullable. |
| `bref_id` | `varchar` | Baseball-Reference ID (`BREFID`), e.g. `"ohtansh01"`. Nullable. |
| `bio_data` | `jsonb` | Supplemental bio fields not in SFBB. Defaults to `{}`. See shape below. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | Auto-updated on write. Tracks last SFBB sync time. |
| `deleted_at` | `timestamp` | Soft delete. Players absent from a replace-mode sync are soft-deleted. |

**SFBB column mapping** — constants in `src/app/api/admin/sync-players/route.ts`:

| SFBB column | maps to |
|---|---|
| `IDPLAYER` | `sfbb_id` |
| `PLAYERNAME` | `player_name` |
| `BIRTHDATE` | `birthday` |
| `POS` | `positions` |
| `TEAM` | `team` |
| `LG` | `mlb_level` |
| `ACTIVE` | `active` |
| `MLBID` | `mlbam_id` |
| `IDFANGRAPHS` | `fangraphs_id` |
| `FANGRAPHSMINORSID` | `fangraphs_minors_id` |
| `CBSID` | `cbs_id` |
| `ESPNID` | `espn_id` |
| `YAHOOID` | `yahoo_id` |
| `FANTRAXID` | `fantrax_id` |
| `RETROID` | `retro_id` |
| `NFBCID` | `nfbc_id` |
| `BREFID` | `bref_id` |

**`bio_data` shape** — for supplemental data not provided by SFBB (e.g. handedness, physical stats):
```json
{
  "preferred_name": "Shohei",
  "nick_names": ["Showtime"],
  "bats": "L",
  "throws": "R",
  "height": 76,
  "weight": 210,
  "born": "Oshu, Iwate, Japan",
  "links": {
    "bbref": "https://www.baseball-reference.com/players/o/ohtansh01.shtml",
    "sabr": "..."
  }
}
```

| Bio field | Type | Notes |
|---|---|---|
| `preferred_name` | string | Nullable |
| `nick_names` | string[] | Nullable |
| `bats` | string | `"L"`, `"R"`, or `"S"` |
| `throws` | string | `"L"` or `"R"` |
| `height` | integer | Inches (e.g. 76 = 6'4") |
| `weight` | integer | Pounds |
| `born` | string | City, State/Country |
| `links` | object | Keyed by source name (`bbref`, `sabr`, etc.) |

**Note:** `player_stats` can be looked up by `fangraphs_id` or `fangraphs_minors_id` depending on the stat source.

---

### `stat_definitions`

A registry of known stat abbreviations used as keys in `player_stats.stats`. Manually maintained; seeded once.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `abbreviation` | `varchar` UNIQUE | e.g. `"HR"`, `"wOBA"`, `"ERA"`. Required. |
| `name` | `text` | Full name, e.g. `"Home Runs"`. Nullable. |
| `description` | `text` | Nullable. |
| `format` | `varchar` | Display format hint: `"integer"`, `"#.###"`, `"#.##"`, `"string"`. Nullable. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Soft delete. |

---

### `player_stats`

Stats per player per season. Keyed on `(player_id, season)` — upserted on re-import so re-uploading a CSV is safe.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK → `players.id` | Required. |
| `season` | `int` | 4-digit year, e.g. `2024`. Required. |
| `mlb_team` | `varchar(10)` | Team abbreviation or `"FA"` for free agent. Nullable. |
| `stats` | `jsonb` | Stat values keyed by `stat_definitions.abbreviation`. Required. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Soft delete. |

**Unique constraint:** `(player_id, season)`

**`stats` shape**
```json
{
  "PA": 597,
  "HR": 54,
  "RBI": 130,
  "SB": 59,
  "AVG": 0.310,
  "OBP": 0.390,
  "SLG": 0.646,
  "wOBA": 0.443
}
```

---

## League & Multi-Tenancy

Each league is a Clerk organization. Access control (commissioner, manager, etc.) is enforced via `league_members` roles.

### `leagues`

One row per league. Maps 1:1 to a Clerk org.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `clerk_org_id` | `varchar` UNIQUE | Clerk organization ID — the tenancy boundary. Required. |
| `league_name` | `text` | Required. |
| `league_format` | `enum LeagueFormat` | Scoring format. Nullable. See enum below. |
| `fantasy_platform` | `varchar` | Host platform name, e.g. `"ottoneu"`, `"fantrax"`, `"espn"`. Nullable. |
| `host_league_url` | `text` | URL or deep-link to the league on its host platform. Nullable. |
| `roster_config` | `jsonb` | Slot definitions for each team. Required. See shape below. |
| `is_auction` | `boolean` | Defaults to `false`. |
| `is_h2h` | `boolean` | Head-to-head scoring. Defaults to `false`. |
| `league_cap` | `integer` | Salary cap per team in whole dollars. Null for non-auction leagues. |
| `seasons` | `int[]` | Array of 4-digit years the league was active, e.g. `[2023, 2024, 2025]`. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Soft delete. |

**`roster_config` shape** (example: standard Ottoneu)
```json
{
  "C": 2,
  "1B": 1,
  "2B": 1,
  "3B": 1,
  "SS": 1,
  "MI": 1,
  "OF": 5,
  "Util": 1,
  "Bench (batters)": 3,
  "Minors (batters)": 2,
  "IL60": 2,
  "SP": 9,
  "RP": 3,
  "Bench (pitchers)": 3,
  "Minors (pitchers)": 2
}
```
Keys are arbitrary slot labels; values are the count of that slot. This drives the shape of `teams.current_roster` and is flexible enough to support CI, IL, and other non-standard league formats.

**`LeagueFormat` enum**

| Value | Display | Description |
|---|---|---|
| `FGPTS` | FanGraphs Points | FanGraphs points-based scoring |
| `SABR` | SABR Points | SABR-style points scoring |
| `ROTO_5X5` | 5x5 Rotisserie | Traditional 5 batting / 5 pitching categories |
| `ROTO_4X5` | 4x5 Rotisserie | 4 batting / 5 pitching categories |
| `CUSTOM` | Custom | Commissioner-defined scoring |

---

### `league_members`

Junction table linking Clerk users to leagues with a role. Composite PK on `(clerk_user_id, league_id)`.

| Column | Type | Notes |
|---|---|---|
| `clerk_user_id` | `varchar` PK (composite) | Clerk user ID. |
| `league_id` | `uuid` PK (composite) FK → `leagues.id` | |
| `role` | `enum LeagueMemberRole` | Required. |

**`LeagueMemberRole` enum**

| Value | Description |
|---|---|
| `COMMISSIONER` | Full admin of the league |
| `CO_COMMISSIONER` | Shared admin privileges |
| `MANAGER` | Primary team manager |
| `CO_MANAGER` | Shared management of a team |
| `ONLOOKER` | Read-only league access |

---

## Team & Roster

### `teams`

One row per team per league. Rosters and finances stored as JSONB to accommodate the wide variety of league slot configurations.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `league_id` | `uuid` FK → `leagues.id` | Required. |
| `team_name` | `text` | Required. |
| `current_roster` | `jsonb` | Maps slot keys to player UUIDs or `null`. Defaults to `{}`. See shape below. |
| `finance_data` | `jsonb` | Budget and loan tracking. Defaults to `{}`. See shape below. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Soft delete. |

**`current_roster` shape**

Slot keys are derived from `league.roster_config` with a `_N` suffix when count > 1. Values are player UUIDs or `null` for empty slots.
```json
{
  "C_1": "a1b2c3d4-...",
  "C_2": null,
  "1B": "e5f6g7h8-...",
  "OF_1": "i9j0k1l2-...",
  "OF_2": null,
  "SP_1": "m3n4o5p6-...",
  "Bench (batters)_1": null
}
```

**`finance_data` shape** — all values in whole dollars
```json
{
  "budget": 400,
  "spent": 212,
  "loans_in": 1,
  "loans_out": 0
}
```

### `team_managers`

Junction table linking Clerk users to teams. A team can have one primary manager and multiple co-managers. Composite PK on `(clerk_user_id, team_id)`.

| Column | Type | Notes |
|---|---|---|
| `clerk_user_id` | `varchar` PK (composite) | Clerk user ID. |
| `team_id` | `uuid` PK (composite) FK → `teams.id` | |
| `is_primary` | `boolean` | `true` for the primary manager. Defaults to `true`. |

---

### `roster_history`

Append-only log of players cut from a team. Enables historical roster snapshots and salary cap auditing. Every cut writes a new row — rows are never updated.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `team_id` | `uuid` FK → `teams.id` | Required. |
| `player_id` | `uuid` FK → `players.id` | Required. |
| `salary_at_cut` | `integer` | Whole dollar salary held at time of cut. Nullable for non-auction leagues. |
| `cut_date` | `timestamp` | Defaults to `now()`. |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Soft delete. |

---

## Transactions

**TODO:** The `transactions` table is planned but not yet implemented.

All league activity will be tracked as an append-only ledger to allow reconstructing a historical snapshot of any team at any point in time. The salary cap state for a team is derived by replaying its transactions.

**Planned columns:**

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `league_id` | `uuid` FK → `leagues.id` | |
| `team_id` | `uuid` FK → `teams.id` | |
| `player_id` | `uuid` FK → `players.id` | |
| `type` | `enum` | `ADD`, `CUT`, `TRADE_IN`, `TRADE_OUT`, `SALARY_CHANGE` |
| `salary` | `decimal(10,2)` | Salary at time of transaction. Nullable. |
| `transaction_date` | `timestamp` | When the transaction occurred. |
| `notes` | `text` | Optional commissioner note. |
| `created_at` | `timestamp` | |

**Key query:** To compute a team's current salary cap usage, sum the salary of all active `ADD`/`TRADE_IN` transactions minus `CUT`/`TRADE_OUT` transactions for that team in the current season.

---

## Entity Relationship Summary

```
Clerk Org ──────────────────── leagues (1:1 via clerk_org_id)
                                    │
               ┌────────────────────┼──────────────────┐
               │                    │                   │
        league_members            teams            seasons[]
        (clerk_user_id,             │
          league_id, role)          ├── team_managers (clerk_user_id, team_id)
                                    │
                                    ├── roster_history → players
                                    │
                                    └── transactions (planned) → players

players ─────────────────────── player_stats (player_id, season)
players ─────────────────────── roster_history
players ─────────────────────── transactions (planned)

stat_definitions   global lookup for player_stats.stats JSONB keys
```

## Notes

All tables include soft-delete (`deleted_at`) and standard audit timestamps (`created_at`, `updated_at`).

