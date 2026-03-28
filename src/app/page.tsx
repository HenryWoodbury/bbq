import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const { userId } = await auth()

  if (!userId) {
    return <WelcomePage />
  }

  const leagues = await prisma.league.findMany({
    where: { members: { some: { clerkUserId: userId } }, deletedAt: null },
    orderBy: { leagueName: "asc" },
    select: {
      id: true,
      leagueName: true,
      seasons: true,
      template: { select: { scoring: true } },
      _count: {
        select: {
          members: true,
          teams: { where: { deletedAt: null } },
        },
      },
    },
  })

  return (
    <div className="flex flex-col gap-4">

      <h1>Your leagues</h1>

      {leagues.length === 0 ? (
        <p className="body-muted">
          You&apos;re not in any leagues yet. Create or join one via the org
          switcher in the header.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </section>
      )}
    </div>
  )
}

function WelcomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col">
        <div className="flex flex-col gap-3">
          <h1 className="hero-heading">BBQ</h1>
          <p className="hero-subtitle">
            Fantasy baseball league management — drafts, rosters, and auction
            tools.
          </p>
        </div>
        <div className="flex gap-3">
          <SignUpButton mode="redirect">
            <Button className="px-5 py-2.5">Get started</Button>
          </SignUpButton>
          <SignInButton mode="redirect">
            <Button variant="secondary" className="px-5 py-2.5">
              Sign in
            </Button>
          </SignInButton>
        </div>
      </section>
    </div>
  )
}

type LeagueSummary = {
  id: string
  leagueName: string
  seasons: number[]
  template: { scoring: string } | null
  _count: { members: number; teams: number }
}

function LeagueCard({ league }: { league: LeagueSummary }) {
  const currentSeason =
    league.seasons.length > 0 ? Math.max(...league.seasons) : null

  const scoringLabel = (() => {
    switch (league.template?.scoring) {
      case "FiveX5": return "5×5"
      case "FourX4": return "4×4"
      case "Fangraphs": return "FGPTs"
      case "SABR": return "SABR"
      case "Points": return "Points"
      default: return "—"
    }
  })()

  return (
    <Link
      href={`/leagues/${league.id}`}
      className="card-interactive flex flex-col gap-4 p-6"
    >
      <h2 className="font-semibold text-foreground">
        {league.leagueName}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Stat label="Format" value={scoringLabel} />
        <Stat label="Season" value={currentSeason?.toString() ?? "—"} />
        <Stat label="Teams" value={league._count.teams} />
        <Stat label="Members" value={league._count.members} />
      </dl>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
