> **Status: Design spec** — Template definitions below are forward-looking. A subset is implemented via `LeagueTemplate` seeded in `prisma/seed.ts`. Enum values match the current `prisma/schema.prisma`.

# League Format Templates

This file defines **common draft format templates** as opinionated bundles of draft options (from `options.md`) plus compatible rule-sets (from `rules.md`).

Each template is intended to:
- Provide **sensible defaults** for new leagues.
- Map directly to `LeagueTemplate` fields in the DB.
- Be a starting point that commissioners can customize.

**Enum reference** (Prisma model values):
- `platform`: `ESPN` | `Ottoneu` | `Custom`
- `playType`: `H2H` | `Season`
- `scoring`: `FiveX5` | `FourX4` | `Fangraphs` | `SABR` | `Points`
- `draftMode`: `Live` | `Slow`
- `draftType`: `Snake` | `Auction`

---

## 1. Ottoneu 4x4 (Classic)

**Description**: 12-team Ottoneu-style 4×4 roto league.

| Field | Value |
|---|---|
| `platform` | `Ottoneu` |
| `playType` | `Season` |
| `scoring` | `FourX4` |
| `draftType` | `Auction` |
| `draftMode` | `Live` |
| `cap` | 400 |

**Rules (summarized)**
- 12 teams, 40-man rosters, roto 4×4 scoring, IP cap, salary-cap + arbitration, FAAB waivers, loans.

---

## 2. Ottoneu 5x5

**Description**: Same as Ottoneu 4×4 but with 5×5 roto scoring.

| Field | Value |
|---|---|
| `platform` | `Ottoneu` |
| `playType` | `Season` |
| `scoring` | `FiveX5` |
| `draftType` | `Auction` |
| `draftMode` | `Live` |
| `cap` | 400 |

**Rules**
- 5×5 categories (`r`, `hr`, `rbi`, `sb`, `avg` / `w`, `sv`, `k`, `era`, `whip`).

---

## 3. Ottoneu FanGraphs Points (Season-Long)

**Description**: 12-team Ottoneu FanGraphs points league.

| Field | Value |
|---|---|
| `platform` | `Ottoneu` |
| `playType` | `Season` |
| `scoring` | `Fangraphs` |
| `draftType` | `Auction` |
| `draftMode` | `Live` |
| `cap` | 400 |

**Rules**
- FanGraphs points scoring, IP cap, no playoffs, 40-man rosters, salary-cap + arbitration.

---

## 4. Ottoneu SABR Points (Season-Long)

**Description**: 12-team Ottoneu SABR linear-weights points league.

| Field | Value |
|---|---|
| `platform` | `Ottoneu` |
| `playType` | `Season` |
| `scoring` | `SABR` |
| `draftType` | `Auction` |
| `draftMode` | `Live` |
| `cap` | 400 |

**Rules**
- SABR linear-weights points. Batters: wRAA-based. Pitchers: peripherals (K, BB, HR allowed) — not wins or saves.
- IP cap, no playoffs, 40-man rosters, salary-cap + arbitration.

---

## 5. ESPN 5×5 Roto (Season-Long)

**Description**: Classic 10-team ESPN-style 5×5 roto.

| Field | Value |
|---|---|
| `platform` | `ESPN` |
| `playType` | `Season` |
| `scoring` | `FiveX5` |
| `draftType` | `Snake` |
| `draftMode` | `Live` |

**Rules**
- 5×5 roto, shallow rosters (~25 players), rolling waivers, no FAAB.

---

## 6. ESPN 5×5 H2H Each Category

**Description**: ESPN-style H2H each-category using 5×5.

| Field | Value |
|---|---|
| `platform` | `ESPN` |
| `playType` | `H2H` |
| `scoring` | `FiveX5` |
| `draftType` | `Snake` |
| `draftMode` | `Live` |

**Rules**
- H2H each-category 5×5, 4–6 team playoffs.

---

## 7. ESPN Points (Season-Long)

**Description**: ESPN-style 10-team season-long total points.

| Field | Value |
|---|---|
| `platform` | `ESPN` |
| `playType` | `Season` |
| `scoring` | `Points` |
| `draftType` | `Snake` |
| `draftMode` | `Live` |

**Rules**
- Cumulative ESPN default points, 25-man rosters, rolling waivers, no playoffs.

---

## 8. ESPN H2H Points

**Description**: ESPN-style 10-team H2H points with playoffs.

| Field | Value |
|---|---|
| `platform` | `ESPN` |
| `playType` | `H2H` |
| `scoring` | `Points` |
| `draftType` | `Snake` |
| `draftMode` | `Live` |

**Rules**
- Weekly H2H points, standard ESPN points weights, 4–6 team playoffs, rolling waivers, adds-per-week limit.

---

## 9. Custom Baseline (Fully Editable)

**Description**: Minimal defaults for flexible custom leagues.

| Field | Value |
|---|---|
| `platform` | `Custom` |
| `playType` | `Season` |
| `scoring` | `FiveX5` |
| `draftType` | `Snake` |
| `draftMode` | `Live` |

**Rules**
- 10 teams, 5×5 roto, ~23-man roster, rolling waivers; all details customizable per league.

---

## Notes on Implementation

- Template IDs are UUIDs — they are the primary key and not exposed to end users.
- Supported scoring systems: `FiveX5`, `FourX4`, `Fangraphs`, `SABR`, `Points`.
- Each template is stored as a `LeagueTemplate` row in the DB.
- UI can present a **template picker** with three sequential choices: platform (Ottoneu / ESPN / Custom), scoring format, play type (Season / H2H).
- League instances store `templateId` — a FK to `LeagueTemplate`. Template changes after league creation may need a version bump.
