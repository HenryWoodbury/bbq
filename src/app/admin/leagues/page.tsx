import { StatCard } from "@/components/stat-card"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { LeaguesTable } from "../leagues-table"

export const metadata = { title: "Manage Leagues — BBQ" }

export default async function AdminLeaguesPage() {
  await requireAdmin()

  const [leagueCount, teamCount, leagues] = await Promise.all([
    prisma.league.count({ where: { deletedAt: null } }),
    prisma.team.count({ where: { deletedAt: null } }),
    prisma.league.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        leagueName: true,
        seasons: true,
        template: { select: { name: true, platform: true, scoring: true } },
        _count: {
          select: { members: true, teams: { where: { deletedAt: null } } },
        },
      },
    }),
  ])

  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Leagues</h1>

      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Leagues" value={leagueCount} />
          <StatCard label="Teams" value={teamCount} />
        </div>
      </section>

      <section>
        <h2 className="mb-3">Leagues</h2>
        <LeaguesTable data={leagues} />
      </section>
    </div>
  )
}
