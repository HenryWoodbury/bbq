# Database Schema

## Models

### Global Player Universe

| Model | Purpose |
|---|---|
| `Player` | Canonical player record — name variants, MLB team, positions, 10+ cross-ref IDs (MLBAM, Fangraphs, CBS, ESPN, Yahoo, Fantrax, Retro, NFBC, Baseball Reference, Ottoneu) |
| `PlayerUniverse` | Format-specific player records (e.g., Ottoneu) → FK to canonical `Player` |
| `PlayerOverride` | Manual overrides for display names, dates, attributes |
| `StatDefinition` | Batter/pitcher stat catalog (41 batter, 33 pitcher), with format hints (integer/decimal/percentage) |
| `PlayerStat` | JSONB stats per player-season |

### Multi-Tenancy (Clerk-Linked)

| Model | Purpose |
|---|---|
| `League` | 1:1 Clerk Organization; stores format, roster config, platform (Ottoneu/Fantrax/ESPN) |
| `LeagueMember` | Users → leagues with roles: `COMMISSIONER`, `CO_COMMISSIONER`, `MANAGER`, `CO_MANAGER`, `ONLOOKER` |

### Team & Roster

| Model | Purpose |
|---|---|
| `Team` | League teams; JSONB `currentRoster` + `financeData` (budget/spent/loans) |
| `TeamManager` | User→Team with `isPrimary` flag |
| `RosterHistory` | Roster cut tracking (salary, cut date) |

### Enums

- `LeagueFormat`: `FGPTS`, `SABR`, `ROTO_5X5`, `ROTO_4X5`, `CUSTOM`

## Indexes

- PostgreSQL GIN index on `Player.positions` (array search)
- FK indexes on primary relationships

## Security

No database-level RLS. Security is enforced at the application layer:

1. **Route protection** — Clerk middleware (`src/proxy.ts`) guards all non-public routes
2. **API auth** — `await auth.protect()` in each API route handler
3. **Data scoping** — Queries scoped by `orgId` (league) and `clerkUserId` (member/manager)

RLS is planned for Beta/RC stages as defense-in-depth.
