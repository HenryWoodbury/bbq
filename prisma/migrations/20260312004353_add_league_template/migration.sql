-- CreateEnum
CREATE TYPE "StatPlayerType" AS ENUM ('BATTER', 'PITCHER');

-- CreateEnum
CREATE TYPE "LeagueFormat" AS ENUM ('FGPTS', 'SABR', 'ROTO_5X5', 'ROTO_4X5', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LeagueMemberRole" AS ENUM ('COMMISSIONER', 'CO_COMMISSIONER', 'MANAGER', 'CO_MANAGER', 'ONLOOKER');

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
    "active" BOOLEAN,
    "bats" TEXT,
    "throws" TEXT,
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
    "mlb_team" VARCHAR(10),
    "stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "clerk_org_id" TEXT NOT NULL,
    "league_name" TEXT NOT NULL,
    "league_format" "LeagueFormat",
    "fantasy_platform" TEXT,
    "host_league_url" TEXT,
    "roster_config" JSONB NOT NULL,
    "is_auction" BOOLEAN NOT NULL DEFAULT false,
    "is_h2h" BOOLEAN NOT NULL DEFAULT false,
    "league_cap" INTEGER,
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
CREATE TABLE "league_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL,
    "rules_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "league_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_sfbb_id_key" ON "players"("sfbb_id");

-- CreateIndex
CREATE INDEX "players_positions_idx" ON "players" USING GIN ("positions");

-- CreateIndex
CREATE INDEX "player_universe_player_id_idx" ON "player_universe"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_universe_format_ottoneu_id_key" ON "player_universe"("format", "ottoneu_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_overrides_player_id_key" ON "player_overrides"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "stat_definitions_abbreviation_player_type_key" ON "stat_definitions"("abbreviation", "player_type");

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_player_id_season_key" ON "player_stats"("player_id", "season");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_clerk_org_id_key" ON "leagues"("clerk_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "league_templates_slug_key" ON "league_templates"("slug");

-- AddForeignKey
ALTER TABLE "player_universe" ADD CONSTRAINT "player_universe_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_overrides" ADD CONSTRAINT "player_overrides_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
