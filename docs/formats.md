# League Formats

> **Type:** spec &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14 against `prisma/seed.ts`

## Goal
A commissioner creating a league must be able to pick a **format** — an
opinionated bundle of platform, play-type, scoring, draft style, team count,
roster size, and salary cap — instead of configuring each setting by hand. A
format provides sensible defaults and a starting point that can be customized.

Each format is a `LeagueFormat` row (see [schema.md](schema.md)); a `League`
references one via `formatId`.

## Invariants & constraints
- `LeagueFormat.name` is **unique**; formats are upserted by name in the seed.
- `cap` is set only for **auction** formats; snake formats leave it null.
- A format's `rosters` JSON drives the shape of every `Team.currentRoster` in
  leagues using it.
- Changing a format after leagues reference it should bump `version` (formats are
  versioned; leagues store the FK, not a copy).

## Capability — seed the standard formats
- **Goal:** ship a ready-to-use catalog covering the platforms BBQ targets.
- **Acceptance:** after `pnpm db:seed`, `LeagueFormat` contains the 12 rows below,
  each idempotently upserted by `name`.
- **Realization:** `prisma/seed.ts` (`seedLeagueFormats`); roster arrays
  `CUSTOM_ROSTER`, `ESPN_ROSTER`, `OTTONEU_ROSTER`.

### The 12 seeded formats
Enum values match `prisma/schema.prisma` (`Format*` enums).

| Name | platform | playType | scoring | draftMode | draftType | teams | rosterSize | cap |
|---|---|---|---|---|---|---|---|---|
| Custom | Custom | Season | FiveX5 | Live | Snake | 12 | 23 | — |
| ESPN 5x5 | ESPN | Season | FiveX5 | Live | Snake | 12 | 19 | — |
| ESPN Points | ESPN | Season | Points | Live | Snake | 12 | 19 | — |
| ESPN H2H 5x5 | ESPN | H2H | FiveX5 | Live | Snake | 12 | 19 | — |
| ESPN H2H Points | ESPN | H2H | Points | Live | Snake | 12 | 19 | — |
| Ottoneu 4x4 | Ottoneu | Season | FourX4 | Slow | Auction | 12 | 40 | 400 |
| Ottoneu 5x5 | Ottoneu | Season | FiveX5 | Slow | Auction | 12 | 40 | 400 |
| Ottoneu FGPTs | Ottoneu | Season | Fangraphs | Slow | Auction | 12 | 40 | 400 |
| Ottoneu SABR | Ottoneu | Season | SABR | Slow | Auction | 12 | 40 | 400 |
| Ottoneu H2H FGPTs | Ottoneu | H2H | Fangraphs | Slow | Auction | 12 | 40 | 400 |
| Ottoneu H2H SABR | Ottoneu | H2H | SABR | Slow | Auction | 12 | 40 | 400 |

> The 11th–12th rows above are both Ottoneu H2H variants; the seed defines 11
> named formats plus the `Custom` baseline. Each carries a `description` and a
> markdown `rulesText` summary in the seed.

> **Reconciliation note:** earlier docs described 9 forward-looking templates under
> a `LeagueTemplate` model with all drafts `Live`. The shipped model is
> `LeagueFormat`; Ottoneu formats are **`Slow`** (slow auction) and ESPN formats
> are **`Live` Snake**. The table above reflects the seed.

## Capability — manage formats via admin API
- **Goal:** an admin can create, edit, and retire formats beyond the seed.
- **Acceptance:** the `/api/admin/league-formats` routes (see [api.md](api.md))
  CRUD `LeagueFormat`; `isActive`/`deletedAt` retire a format without breaking
  leagues that reference it.
- **Realization:** `src/app/api/admin/league-formats/**`, `src/lib/queries/formats.ts`,
  admin UI at `src/app/admin/leagues/page.tsx`.

## Scoring reference
| `FormatScoring` | Meaning |
|---|---|
| `FiveX5` (`5x5`) | Rotisserie 5×5 (R, HR, RBI, SB, AVG / W, SV, K, ERA, WHIP) |
| `FourX4` (`4x4`) | Rotisserie 4×4 (HR, RBI, SB, AVG / W, SV, ERA, WHIP) |
| `Fangraphs` | FanGraphs linear-weights points |
| `SABR` | SABR linear-weights points (peripheral-based for pitchers) |
| `Points` | Platform-native points (e.g. ESPN defaults) |

## Next / Open questions
- **Format picker UI** — the intended flow is a sequential picker (platform →
  scoring → play-type). Not yet built as a guided flow.
- **Per-league customization** — leagues currently reference a format; cloning a
  format into editable per-league overrides is not yet implemented.
- `options.md` / `rules.md` (referenced historically) do not exist in `docs/`;
  the authoritative rules summary now lives in each format's `rulesText`.
