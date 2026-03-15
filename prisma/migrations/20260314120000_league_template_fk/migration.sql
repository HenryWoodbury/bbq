-- Add template_id FK to leagues
ALTER TABLE "leagues"
  ADD COLUMN "template_id" TEXT,
  ADD CONSTRAINT "leagues_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "league_templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop removed columns
ALTER TABLE "leagues"
  DROP COLUMN IF EXISTS "league_format",
  DROP COLUMN IF EXISTS "fantasy_platform",
  DROP COLUMN IF EXISTS "roster_config",
  DROP COLUMN IF EXISTS "is_auction",
  DROP COLUMN IF EXISTS "is_h2h",
  DROP COLUMN IF EXISTS "league_cap";

-- Drop the now-unused enum
DROP TYPE IF EXISTS "LeagueFormat";
