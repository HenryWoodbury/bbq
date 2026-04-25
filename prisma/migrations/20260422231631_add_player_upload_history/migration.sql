-- CreateEnum
CREATE TYPE "StatPlayerType" AS ENUM ('BATTER', 'PITCHER');

-- CreateEnum
CREATE TYPE "StatSplit" AS ENUM ('none', 'neutral', 'vs_left', 'vs_right');

-- CreateEnum
CREATE TYPE "StatProjection" AS ENUM ('none', 'zips', 'steamer', 'atc', 'the_bat', 'the_bat_x', 'oopsy', 'depth_charts', 'zips_dc', 'ros');

-- CreateEnum
CREATE TYPE "LeagueMemberRole" AS ENUM ('COMMISSIONER', 'CO_COMMISSIONER', 'MANAGER', 'CO_MANAGER', 'ONLOOKER');

-- CreateEnum
CREATE TYPE "ExportScope" AS ENUM ('players', 'teams', 'leagues', 'platform');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('standard', 'splits', 'profiles');

-- CreateEnum
CREATE TYPE "FormatPlatform" AS ENUM ('ESPN', 'Ottoneu', 'Custom');

-- CreateEnum
CREATE TYPE "FormatPlayType" AS ENUM ('H2H', 'Season');

-- CreateEnum
CREATE TYPE "FormatScoring" AS ENUM ('5x5', '4x4', 'fangraphs', 'sabr', 'points');

-- CreateEnum
CREATE TYPE "FormatDraftMode" AS ENUM ('live', 'slow');

-- CreateEnum
CREATE TYPE "FormatDraftType" AS ENUM ('snake', 'auction');

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "sfbb_id" TEXT NOT NULL,
    "player_name" TEXT NOT NULL,
    "fg_special_char" TEXT,
    "positions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "team" TEXT,
    "mlb_level" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "birthday" DATE,
    "first_name" TEXT,
    "last_name" TEXT,
    "bats" TEXT,
    "throws" TEXT,
    "mlbam_id" INTEGER,
    "fangraphs_id" TEXT,
    "cbs_id" INTEGER,
    "espn_id" INTEGER,
    "yahoo_id" INTEGER,
    "fantrax_id" TEXT,
    "retro_id" TEXT,
    "nfbc_id" INTEGER,
    "bref_id" TEXT,
    "ottoneu_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_universe" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "ottoneu_id" INTEGER NOT NULL,
    "player_name" TEXT NOT NULL,
    "positions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fangraphs_id" TEXT,
    "mlbam_id" INTEGER,
    "birthday" DATE,
    "player_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "player_universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_overrides" (
    "id" TEXT NOT NULL,
    "player_id" TEXT,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "fangraphs_id" TEXT,
    "mlbam_id" INTEGER,
    "ottoneu_id" INTEGER,
    "display_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "nickname" TEXT,
    "birthday" DATE,
    "team" TEXT,
    "mlb_level" TEXT,
    "league" TEXT,
    "active" BOOLEAN,
    "bats" TEXT,
    "throws" TEXT,
    "positions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "player_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_definitions" (
    "id" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "player_type" "StatPlayerType" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "format" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stat_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_stats" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "player_type" "StatPlayerType" NOT NULL DEFAULT 'BATTER',
    "projection" "StatProjection" NOT NULL DEFAULT 'none',
    "neutralized" BOOLEAN NOT NULL DEFAULT false,
    "split" "StatSplit" NOT NULL DEFAULT 'none',
    "ros" BOOLEAN NOT NULL DEFAULT false,
    "mlb_team" VARCHAR(10),
    "stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_uploads" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "player_type" "StatPlayerType" NOT NULL,
    "projection" "StatProjection" NOT NULL,
    "split" "StatSplit" NOT NULL,
    "ros" BOOLEAN NOT NULL DEFAULT false,
    "file_name" TEXT,
    "total" INTEGER NOT NULL,
    "linked" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "upserted" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_map_imports" (
    "id" TEXT NOT NULL,
    "season" INTEGER,
    "file_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" INTEGER NOT NULL,
    "inserted" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "deleted" INTEGER NOT NULL,

    CONSTRAINT "player_map_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_universe_uploads" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "file_name" TEXT,
    "total" INTEGER NOT NULL,
    "inserted" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "deleted" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_universe_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "clerk_org_id" TEXT NOT NULL,
    "league_name" TEXT NOT NULL,
    "format_id" TEXT,
    "host_league_url" TEXT,
    "seasons" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_members" (
    "clerk_user_id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "role" "LeagueMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "league_members_pkey" PRIMARY KEY ("clerk_user_id","league_id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "current_roster" JSONB NOT NULL DEFAULT '{}',
    "finance_data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_managers" (
    "clerk_user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "team_managers_pkey" PRIMARY KEY ("clerk_user_id","team_id")
);

-- CreateTable
CREATE TABLE "roster_history" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "salary_at_cut" INTEGER,
    "cut_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roster_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_exports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "ExportScope" NOT NULL,
    "type" "ExportType" NOT NULL,
    "fields" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_formats" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "FormatPlatform" NOT NULL,
    "play_type" "FormatPlayType" NOT NULL,
    "scoring" "FormatScoring" NOT NULL,
    "draft_mode" "FormatDraftMode" NOT NULL,
    "draft_type" "FormatDraftType" NOT NULL,
    "teams" INTEGER NOT NULL DEFAULT 12,
    "roster_size" INTEGER NOT NULL,
    "cap" INTEGER,
    "rosters" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "rules_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "league_formats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_sfbb_id_key" ON "players"("sfbb_id");

-- CreateIndex
CREATE INDEX "players_positions_idx" ON "players" USING GIN ("positions");

-- CreateIndex
CREATE INDEX "players_fangraphs_id_idx" ON "players"("fangraphs_id");

-- CreateIndex
CREATE INDEX "players_mlbam_id_idx" ON "players"("mlbam_id");

-- CreateIndex
CREATE INDEX "players_ottoneu_id_idx" ON "players"("ottoneu_id");

-- CreateIndex
CREATE INDEX "player_universe_player_id_idx" ON "player_universe"("player_id");

-- CreateIndex
CREATE INDEX "player_universe_fangraphs_id_idx" ON "player_universe"("fangraphs_id");

-- CreateIndex
CREATE INDEX "player_universe_mlbam_id_idx" ON "player_universe"("mlbam_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_universe_format_ottoneu_id_key" ON "player_universe"("format", "ottoneu_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_overrides_player_id_key" ON "player_overrides"("player_id");

-- CreateIndex
CREATE INDEX "player_overrides_fangraphs_id_idx" ON "player_overrides"("fangraphs_id");

-- CreateIndex
CREATE INDEX "player_overrides_mlbam_id_idx" ON "player_overrides"("mlbam_id");

-- CreateIndex
CREATE INDEX "player_overrides_ottoneu_id_idx" ON "player_overrides"("ottoneu_id");

-- CreateIndex
CREATE UNIQUE INDEX "stat_definitions_abbreviation_player_type_key" ON "stat_definitions"("abbreviation", "player_type");

-- CreateIndex
CREATE INDEX "player_stats_season_idx" ON "player_stats"("season");

-- CreateIndex
CREATE INDEX "player_stats_projection_idx" ON "player_stats"("projection");

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_player_id_season_player_type_projection_neutra_key" ON "player_stats"("player_id", "season", "player_type", "projection", "neutralized", "split", "ros");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_clerk_org_id_key" ON "leagues"("clerk_org_id");

-- CreateIndex
CREATE INDEX "leagues_format_id_idx" ON "leagues"("format_id");

-- CreateIndex
CREATE INDEX "league_members_league_id_idx" ON "league_members"("league_id");

-- CreateIndex
CREATE INDEX "league_members_clerk_user_id_idx" ON "league_members"("clerk_user_id");

-- CreateIndex
CREATE INDEX "teams_league_id_idx" ON "teams"("league_id");

-- CreateIndex
CREATE INDEX "team_managers_team_id_idx" ON "team_managers"("team_id");

-- CreateIndex
CREATE INDEX "team_managers_clerk_user_id_idx" ON "team_managers"("clerk_user_id");

-- CreateIndex
CREATE INDEX "roster_history_team_id_idx" ON "roster_history"("team_id");

-- CreateIndex
CREATE INDEX "roster_history_player_id_idx" ON "roster_history"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_exports_name_key" ON "data_exports"("name");

-- CreateIndex
CREATE UNIQUE INDEX "league_formats_name_key" ON "league_formats"("name");

-- AddForeignKey
ALTER TABLE "player_universe" ADD CONSTRAINT "player_universe_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_overrides" ADD CONSTRAINT "player_overrides_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "league_formats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_managers" ADD CONSTRAINT "team_managers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_history" ADD CONSTRAINT "roster_history_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_history" ADD CONSTRAINT "roster_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
