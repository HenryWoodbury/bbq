import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const metadata = { title: "Admin — BBQ" };

export default async function AdminPage() {
  await requireAdmin();

  const [playerCount, leagueCount, teamCount, statDefCount, leagues, statDefs] =
    await Promise.all([
      prisma.player.count({ where: { deletedAt: null } }),
      prisma.league.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.statDefinition.count({ where: { deletedAt: null } }),
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

      {/* Leagues table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Leagues
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {["Name", "Format", "Platform", "Seasons", "Members", "Teams"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {leagues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                    No leagues yet.
                  </td>
                </tr>
              ) : (
                leagues.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {l.leagueName}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {l.leagueFormat ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {l.fantasyPlatform ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {l.seasons.length > 0 ? l.seasons.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {l._count.members}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {l._count.teams}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stat definitions table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Stat Definitions
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {["Abbreviation", "Name", "Format"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {statDefs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                    No stat definitions yet.
                  </td>
                </tr>
              ) : (
                statDefs.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {s.abbreviation}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {s.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {s.format ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
