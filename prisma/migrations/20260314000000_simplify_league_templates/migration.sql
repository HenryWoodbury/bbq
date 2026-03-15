-- CreateEnum
CREATE TYPE "TemplatePlatform" AS ENUM ('ESPN', 'Ottoneu', 'Custom');

-- CreateEnum
CREATE TYPE "TemplatePlayType" AS ENUM ('H2H', 'Season');

-- CreateEnum
CREATE TYPE "TemplateScoring" AS ENUM ('5x5', '4x4', 'fangraphs', 'sabr', 'points');

-- CreateEnum
CREATE TYPE "TemplateDraftMode" AS ENUM ('live', 'slow');

-- CreateEnum
CREATE TYPE "TemplateDraftType" AS ENUM ('snake', 'auction');

-- Drop old unique index on slug
DROP INDEX IF EXISTS "league_templates_slug_key";

-- AlterTable: drop old columns, add new flat columns
ALTER TABLE "league_templates"
  DROP COLUMN IF EXISTS "slug",
  DROP COLUMN IF EXISTS "settings",
  ADD COLUMN "platform"    "TemplatePlatform"  NOT NULL DEFAULT 'Custom',
  ADD COLUMN "play_type"   "TemplatePlayType"  NOT NULL DEFAULT 'Season',
  ADD COLUMN "scoring"     "TemplateScoring"   NOT NULL DEFAULT '5x5',
  ADD COLUMN "draft_mode"  "TemplateDraftMode" NOT NULL DEFAULT 'live',
  ADD COLUMN "draft_type"  "TemplateDraftType" NOT NULL DEFAULT 'snake',
  ADD COLUMN "teams"       INTEGER             NOT NULL DEFAULT 12,
  ADD COLUMN "roster_size" INTEGER             NOT NULL DEFAULT 19,
  ADD COLUMN "cap"         INTEGER,
  ADD COLUMN "rosters"     JSONB               NOT NULL DEFAULT '[]';

-- Add unique constraint on name (names were already unique by convention)
ALTER TABLE "league_templates"
  ADD CONSTRAINT "league_templates_name_key" UNIQUE ("name");

-- Remove column defaults now that existing rows are migrated
ALTER TABLE "league_templates"
  ALTER COLUMN "platform"    DROP DEFAULT,
  ALTER COLUMN "play_type"   DROP DEFAULT,
  ALTER COLUMN "scoring"     DROP DEFAULT,
  ALTER COLUMN "draft_mode"  DROP DEFAULT,
  ALTER COLUMN "draft_type"  DROP DEFAULT;
