-- CreateEnum
CREATE TYPE "StatSplit" AS ENUM ('none', 'vs_left', 'vs_right');

-- AlterTable: player_stats — add columns for player_type, projected, neutralized, split
ALTER TABLE "player_stats"
  ADD COLUMN "player_type" "StatPlayerType" NOT NULL DEFAULT 'BATTER',
  ADD COLUMN "projected" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "neutralized" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "split" "StatSplit" NOT NULL DEFAULT 'none';

-- DropIndex: old unique constraint
DROP INDEX IF EXISTS "player_stats_player_id_season_key";

-- CreateIndex: new composite unique constraint
CREATE UNIQUE INDEX "player_stats_player_id_season_player_type_projected_neutralized_split_key"
  ON "player_stats"("player_id", "season", "player_type", "projected", "neutralized", "split");

-- AlterTable: league_members — add audit timestamp
ALTER TABLE "league_members"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: team_managers — add audit timestamp
ALTER TABLE "team_managers"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: FK indexes — Player cross-ref lookups
CREATE INDEX "players_fangraphs_id_idx" ON "players"("fangraphs_id");
CREATE INDEX "players_mlbam_id_idx" ON "players"("mlbam_id");

-- CreateIndex: FK index — League.templateId reverse lookup
CREATE INDEX "leagues_template_id_idx" ON "leagues"("template_id");

-- CreateIndex: FK index — LeagueMember.leagueId (PK starts with clerkUserId so this is needed)
CREATE INDEX "league_members_league_id_idx" ON "league_members"("league_id");

-- CreateIndex: FK index — Team.leagueId (hot path: list teams per league)
CREATE INDEX "teams_league_id_idx" ON "teams"("league_id");

-- CreateIndex: FK index — TeamManager.teamId (PK starts with clerkUserId)
CREATE INDEX "team_managers_team_id_idx" ON "team_managers"("team_id");

-- CreateIndex: FK indexes — RosterHistory
CREATE INDEX "roster_history_team_id_idx" ON "roster_history"("team_id");
CREATE INDEX "roster_history_player_id_idx" ON "roster_history"("player_id");
