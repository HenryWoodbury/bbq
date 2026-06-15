# Data Exports

> **Type:** spec &nbsp;|&nbsp; **Status:** as-built &nbsp;|&nbsp; **Last reconciled:** 2026-06-14

## Goal
The system must let an admin define **named, ordered column templates** for
outbound data files, so the same selection of fields can be reused to export
players, teams, leagues, or parks in a stable shape — and produce platform-specific
files (e.g. Batcast) on demand.

## Invariants & constraints
- A `DataExport.name` is **unique**.
- `scope` (`ExportScope`: `Players`, `Teams`, `Leagues`, `Parks`, `Platform`)
  declares what the export is about; `type` (`ExportType`: `Standard`, `Splits`,
  `Profiles`) declares its shape.
- `fields` is an **ordered** `String[]`; column order in the output follows it.

## Capability — manage export templates
- **Goal:** an admin can create, edit, and retire export templates.
- **Acceptance:** `GET|POST /api/admin/data-exports` list/create; `PATCH|DELETE
  /api/admin/data-exports/[id]` update/soft-delete. (See [api.md](api.md).)
- **Realization:** `src/app/api/admin/data-exports/**`; admin UI
  `src/app/admin/exports-table.tsx` and `src/app/admin/templates/page.tsx`.
  Templates are seeded by `seedDataExports` in `prisma/seed.ts`.

## Capability — generate a platform export
- **Goal:** an admin can download a file formatted for an external platform.
- **Acceptance:** `GET /api/admin/export/batcast` returns a Batcast-format file.
- **Realization:** `src/app/api/admin/export/batcast/route.ts`; CSV assembly via
  `src/lib/csv.ts` (covered by `src/lib/csv.test.ts`).

## Current realization (map)
- **Model:** `DataExport` + `ExportScope` / `ExportType` enums (see [schema.md](schema.md)).
- **Routes:** `GET|POST /api/admin/data-exports`,
  `PATCH|DELETE /api/admin/data-exports/[id]`, `GET /api/admin/export/batcast`.
- **Logic / UI:** `src/lib/csv.ts`, `src/app/admin/exports-table.tsx`,
  `src/app/admin/templates/page.tsx`.

## Next / Open questions
- **Beyond Batcast** — only the Batcast generator exists; `scope`/`type` anticipate
  more output targets, not yet built.
- **Splits/Profiles shapes** — the exact column sets for `Splits` and `Profiles`
  export types live in code/seed; document them here once stable.
