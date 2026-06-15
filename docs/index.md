# BBQ, or Baseball Queue

Fantasy baseball draft platform. **Start with [overview.md](overview.md)** for the
conceptual target, then drill into a spec below.

## Doc taxonomy
Specs follow the task-structured shape in [`_template.md`](_template.md): intent →
invariants → capabilities (with acceptance) → realization → next. Each carries a
header marking its **type** and **status**.

- **reference** — stable maps of what exists (schema, API, auth, data, theming, testing)
- **spec** — capability-oriented specs for a subsystem (formats, parks, heat maps, exports)
- **plan** — forward-looking work (kept in tech-debt and the "Next" sections)

## Specs

| Doc | Type | Covers |
|---|---|---|
| [overview.md](overview.md) | reference | Conceptual target; the five domains |
| [schema.md](schema.md) | reference | All 17 Prisma models, enums, JSONB shapes |
| [api.md](api.md) | reference | All 29 API routes and their guards |
| [auth.md](auth.md) | reference | Clerk proxy, guards, multi-tenancy |
| [data.md](data.md) | reference | Local DB setup, seeding, workflows |
| [formats.md](formats.md) | spec | The 12 seeded `LeagueFormat` bundles |
| [parks.md](parks.md) | spec | Parks and park factors |
| [heat-maps.md](heat-maps.md) | spec | OKLCH colour scales |
| [data-exports.md](data-exports.md) | spec | Export column templates |
| [player_data.md](player_data.md) | reference | SFBB / Ottoneu data sources |
| [admin.md](admin.md) | reference | Admin data-management surface |
| [theming.md](theming.md) | reference | Tailwind v4 / OKLCH theming |
| [testing.md](testing.md) | reference | Vitest setup and patterns |
| [ball_model.md](ball_model.md) | reference | Python SVG baseball renderer |
| [tech-debt.md](tech-debt.md) | plan | Known issues and deferred work |
