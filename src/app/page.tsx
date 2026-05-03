import { SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { Suspense } from "react"
import { SpinningStitchBall } from "@/components/spinning-stitch-ball"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { prisma } from "@/lib/prisma"
import { scoringLabel } from "@/lib/queries/formats"

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col gap-12">
      <section className="relative flex flex-col overflow-hidden">
        <SpinningStitchBall
          size={160}
          pitch={0}
          roll={0}
          yaw={0}
          spinRpm={10}
          spinAxis="yaw"
          direction="ltr"
          speed={1}
          className="absolute top-0 left-0 opacity-35 dark:opacity-20 z-10"
        />
        {userId ? (
          <div className="relative">
            <h1 className="mb-4">Your leagues</h1>
            <Suspense fallback={<LeagueGridSkeleton />}>
              <LeagueList userId={userId} />
            </Suspense>
          </div>
        ) : (
          <WelcomeContent />
        )}
      </section>
    </div>
  )
}

async function LeagueList({ userId }: { userId: string }) {
  const leagues = await prisma.league.findMany({
    where: { members: { some: { clerkUserId: userId } }, deletedAt: null },
    orderBy: { leagueName: "asc" },
    select: {
      id: true,
      leagueName: true,
      seasons: true,
      format: { select: { scoring: true } },
      _count: {
        select: {
          members: true,
          teams: { where: { deletedAt: null } },
        },
      },
    },
  })

  if (leagues.length === 0) {
    return (
      <p className="body-muted">
        You&apos;re not in any leagues yet. Create or join one via the org
        switcher in the header.
      </p>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {leagues.map((league) => (
        <LeagueCard key={league.id} league={league} />
      ))}
    </section>
  )
}

function LeagueGridSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {["a", "b", "c"].map((key) => (
        <div key={key} className="card-interactive flex flex-col gap-4 p-6">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </section>
  )
}

function WelcomeContent() {
  return (
    <>
      <div className="relative z-10 flex flex-col gap-3 mb-4">
        <h1 className="hero-heading">BBQ</h1>
        <p className="hero-subtitle">Rosters, Drafts, Tools</p>
      </div>
      <div className="relative z-10 flex gap-3">
        <SignUpButton mode="redirect">
          <Button className="px-5 py-2.5">Get started</Button>
        </SignUpButton>
      </div>
    </>
  )
}

type LeagueSummary = {
  id: string
  leagueName: string
  seasons: number[]
  format: { scoring: string } | null
  _count: { members: number; teams: number }
}

function LeagueCard({ league }: { league: LeagueSummary }) {
  const currentSeason =
    league.seasons.length > 0 ? Math.max(...league.seasons) : null

  const scoring = scoringLabel(league.format?.scoring)

  return (
    <Link
      href={`/leagues/${league.id}`}
      className="card-interactive flex flex-col gap-4 p-6"
    >
      <h2 className="font-semibold text-foreground">{league.leagueName}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Stat label="Format" value={scoring} />
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
