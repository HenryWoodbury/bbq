import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import type { ParkFactorRow } from "@/lib/park-factors"
import { ParkFactorsSection } from "./park-factors-section"
import { ParkPageTabs, type Tab } from "./park-page-tabs"

export const metadata = { title: "Manage Parks — BBQ" }

export default async function AdminParksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams

  const TABS: Tab[] = ["park-factors", "profiles"]
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "park-factors"

  return (
    <div className="page-layout">
      <h1>Manage Parks</h1>
      <ParkPageTabs currentTab={tab}>
        {tab === "park-factors" && (
          <Suspense fallback={<SectionSkeleton />}>
            <ParkFactorsTabContent />
          </Suspense>
        )}
        {tab === "profiles" && <div />}
      </ParkPageTabs>
    </div>
  )
}

async function ParkFactorsTabContent() {
  const raw = await prisma.parkFactor.findMany({
    orderBy: [{ season: "desc" }, { park: { venueName: "asc" } }],
    take: 500,
    include: { park: { select: { venueName: true, teamName: true } } },
  })

  const recentRows: ParkFactorRow[] = raw.map((r) => ({
    venueName: r.park.venueName,
    teamName: r.park.teamName,
    season: r.season,
    batSide: r.batSide,
    rolling: r.rolling,
    factors: r.factors as Record<string, number>,
  }))

  return <ParkFactorsSection recentRows={recentRows} />
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
