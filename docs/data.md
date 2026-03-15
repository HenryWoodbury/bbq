# Local Data Management

## Prerequisites

- Docker Desktop running
- Node v24.13.1 (`nvm use v24.13.1` — required by Prisma 7)
- `.env.local` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bbq?schema=public`

---

## Scripts

### Docker

| Script | Command | Purpose |
|---|---|---|
| `db:up` | `docker compose up -d` | Start Postgres 16 container in background |
| `db:down` | `docker compose down` | Stop container (data volume preserved) |

The container is named `bbq_postgres` and binds to port 5432. Data persists in the `bbq_postgres_data` Docker volume across restarts.

---

### Schema

| Script | Command | Purpose |
|---|---|---|
| `db:push` | `prisma db push` | Apply schema changes directly — no migration file created. Use during active dev when the schema is still in flux. **Destructive if tables are dropped.** |
| `db:migrate` | `prisma migrate dev` | Apply schema changes and create a migration file in `prisma/migrations/`. Use when you want to commit the change as a tracked migration. |
| `db:generate` | `prisma generate` | Re-generate the Prisma client in `src/generated/prisma/`. Run this after any change to `prisma/schema.prisma`. |

`db:push` vs `db:migrate`: prefer `db:push` during early dev; switch to `db:migrate` once the schema stabilises and you need a reproducible migration history.

---

### Seeding

| Script | Command | Purpose |
|---|---|---|
| `db:seed` | `prisma db seed` | Seed stat definitions, league templates, and a demo league + team |
| `seed:players` | `tsx prisma/seed-players.ts` | Seed `Player` and `PlayerUniverse` tables from local CSV files |

#### `db:seed`

Runs `prisma/seed.ts`. Idempotent — safe to run multiple times. Seeds:

- **StatDefinitions** — all batter and pitcher stat abbreviations (wipes and re-creates)
- **LeagueTemplates** — ESPN, Ottoneu, and Custom templates (upserted by name)
- **Demo League** — `BBQ Demo League` with Clerk org ID `org_dev_placeholder`
- **Demo Team** — `Smoke & Signals` attached to the demo league
- **Commissioner membership** — if `SEED_COMMISSIONER_ID=user_xxxx` is set in `.env.local`, creates a COMMISSIONER `LeagueMember` for that Clerk user ID

#### `seed:players`

Runs `prisma/seed-players.ts`. Seeds:

- **Player** table from a PLAYERIDMAP CSV (SFBB format)
- **PlayerUniverse** table from a player universe CSV (Ottoneu format)
- Runs `reconcilePlayerIds()` after both loads to cross-link the tables

Uses **replace mode**: rows present in the CSV are upserted; rows absent from the CSV are soft-deleted (`deletedAt` set).

**CSV sources** — place files in `sources/` at the project root:

| File pattern | Where to get it |
|---|---|
| `PLAYERIDMAP*.csv` | [smartfantasybaseball.com/PLAYERIDMAPCSV](https://www.smartfantasybaseball.com/PLAYERIDMAPCSV) |
| `player_universe_*.csv` | Ottoneu → League Tools → Download Player Universe |

The script auto-discovers files by prefix; rename to match the patterns above. Explicit paths can be passed as arguments:

```bash
pnpm seed:players sources/PLAYERIDMAP.csv sources/player_universe_2025.csv
```

---

### Prisma Studio

```bash
pnpm db:studio
```

Opens a browser-based GUI at `http://localhost:5555` for browsing and editing the local database.

---

## Common Workflows

### First-time setup

```bash
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm seed:players   # after placing CSVs in source/
```

### Full local reset

```bash
pnpm db:down
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm seed:players
```

`db:down` preserves the Docker volume. To also wipe the data:

```bash
docker compose down -v   # drops the bbq_postgres_data volume
pnpm db:up
pnpm db:push
pnpm db:seed
pnpm seed:players
```

### After changing `schema.prisma`

```bash
pnpm db:push       # apply to local db
pnpm db:generate   # regenerate client
```
