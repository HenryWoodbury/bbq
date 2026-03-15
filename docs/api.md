# API Routes

All routes live under `src/app/api/`. Auth levels:

- **authenticated** — any signed-in Clerk user (`auth.protect()`)
- **league member** — must be a member of the target league
- **commissioner** — must have `COMMISSIONER` or `CO_COMMISSIONER` role
- **admin** — must have Clerk `publicMetadata.role = "admin"` (`assertAdmin()`)

---

## Players

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/players` | authenticated | List players with pagination. Params: `search`, `position`, `page`, `limit` |
| `POST` | `/api/players` | admin | Create a player record manually |
| `GET` | `/api/players/[id]` | authenticated | Get a single player by ID |
| `PATCH` | `/api/players/[id]` | admin | Update player fields |
| `POST` | `/api/players/import` | admin | Import players from a CSV upload (SFBB format) |

---

## Player Stats

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/player-stats` | authenticated | List player stats. Params: `playerId`, `season` |
| `POST` | `/api/player-stats` | admin | Create/upsert a `PlayerStat` record |
| `GET` | `/api/player-stats/[id]` | authenticated | Get a single stat row |
| `PATCH` | `/api/player-stats/[id]` | admin | Update a stat row |

---

## Stat Definitions

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/stat-definitions` | authenticated | List all stat definitions |
| `GET` | `/api/stat-definitions/[id]` | authenticated | Get a single stat definition |

---

## Leagues

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/leagues` | authenticated | List leagues the current user is a member of |
| `POST` | `/api/leagues` | authenticated | Create a league for the active Clerk org. Requires `orgId` in session. |
| `GET` | `/api/leagues/[id]` | league member | Get league by ID (membership check enforced) |
| `PATCH` | `/api/leagues/[id]` | commissioner | Update league name, template, or seasons |
| `DELETE` | `/api/leagues/[id]` | commissioner only | Soft-delete league |

---

## Teams

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/teams` | league member | List teams for a league. Required param: `leagueId` |
| `POST` | `/api/teams` | commissioner | Create a team in a league |
| `GET` | `/api/teams/[id]` | league member | Get a single team |
| `PATCH` | `/api/teams/[id]` | commissioner | Update team fields |
| `DELETE` | `/api/teams/[id]` | commissioner | Soft-delete team |

---

## Admin — Players

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/admin/sync-players` | admin | Fetch SFBB Player ID Map CSV from upstream and upsert all players. Body: `{ mode: "replace" \| "additive" }` |
| `POST` | `/api/admin/upload-universe` | admin | Upload a player universe CSV (Ottoneu format) to upsert `PlayerUniverse` rows |
| `GET` | `/api/admin/players/universe-search` | admin | Search `PlayerUniverse` for a player by name/ID |
| `POST` | `/api/admin/players/manual` | admin | Create a manual `PlayerOverride` entry |
| `PATCH` | `/api/admin/players/[id]/override` | admin | Update override fields for a player |

---

## Admin — League Templates

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/league-templates` | admin | List all league templates |
| `POST` | `/api/admin/league-templates` | admin | Create a new league template |
| `PATCH` | `/api/admin/league-templates/[id]` | admin | Update a template |
| `DELETE` | `/api/admin/league-templates/[id]` | admin | Soft-delete a template |

---

## Response Conventions

- Success: `200 OK` (GET/PATCH), `201 Created` (POST), `204 No Content` (DELETE)
- Paginated lists: `{ data: T[], total: number, page: number, limit: number }`
- Errors: `{ error: string }` with appropriate HTTP status
- Soft deletes: sets `deletedAt` timestamp; rows are excluded from all queries via `where: { deletedAt: null }`
