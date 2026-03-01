import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { PlayerImport } from "./PlayerImport";
import { PlayersTable } from "./PlayersTable";
import { LeaguesTable } from "./LeaguesTable";
import { StatDefsTable } from "./StatDefsTable";

export const metadata = { title: "Admin — BBQ" };

export default async function AdminPage() {
  await requireAdmin();

  const [playerCount, leagueCount, teamCount, statDefCount, lastImportedPlayer, leagues, statDefs, players] =
    await Promise.all([
      prisma.player.count({ where: { deletedAt: null } }),
      prisma.league.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.statDefinition.count({ where: { deletedAt: null } }),
      prisma.player.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.league.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          leagueName: true,
          leagueFormat: true,
          fantasyPlatform: true,
          seasons: true,
          _count: { select: { members: true, teams: { where: { deletedAt: null } } } },
        },
      }),
      prisma.statDefinition.findMany({
        where: { deletedAt: null },
        orderBy: { abbreviation: "asc" },
        select: { id: true, abbreviation: true, name: true, format: true },
      }),
      prisma.player.findMany({
        where: { deletedAt: null },
        orderBy: { playerName: "asc" },
        select: {
          id: true,
          playerName: true,
          positions: true,
          fangraphsId: true,
          fangraphsMinorsId: true,
          mlbamId: true,
          birthday: true,
          updatedAt: true,
        },
      }),
    ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          App-wide overview. Access gated to{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            publicMetadata.role = &quot;admin&quot;
          </code>{" "}
          in Clerk.
        </p>
      </section>

      {/* Summary counts */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Totals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Players" value={playerCount} />
          <StatCard label="Leagues" value={leagueCount} />
          <StatCard label="Teams" value={teamCount} />
          <StatCard label="Stat Definitions" value={statDefCount} />
        </div>
      </section>

      {/* Player Universe */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Player Universe
        </h2>
        <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
          Upload the Player Universe CSV to define the canonical player list.
          {lastImportedPlayer && (
            <> Last updated {lastImportedPlayer.updatedAt.toLocaleString()}.</>
          )}
        </p>
        <PlayerImport />
        <div className="mt-4">
          <PlayersTable data={players} />
        </div>
      </section>

      {/* Leagues table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Leagues
        </h2>
        <LeaguesTable data={leagues} />
      </section>

      {/* Stat definitions table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Stat Definitions
        </h2>
        <StatDefsTable data={statDefs} />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
