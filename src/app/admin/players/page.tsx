import { Suspense } from "react"
import type {
  PlayerRow,
  StatRow,
  StatsFilter,
} from "@/components/players-table"
import { TableSkeleton } from "@/components/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { StatPlayerType, StatProjection, StatSplit } from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/auth-helpers"
import { toISODate } from "@/lib/date"
import { prisma } from "@/lib/prisma"
import { PROJECTION_MAP, SPLIT_MAP } from "@/lib/stat-maps"
import { deriveLeagueFromTeam, deriveLevelFromFgId } from "@/lib/team-codes"
import { PlayerPageTabs, type Tab } from "./player-page-tabs"
import { PlayerProfilesSection } from "./player-profiles-section"
import { PlayerStatsSection } from "./player-stats-section"
import { PlayersTableAdmin } from "./players-table-admin"

export const metadata = { title: "Manage Players — BBQ" }

export type StatUploadRow = {
  id: string
  season: number
  playerType: string
  projection: string
  split: string
  fileName: string | null
  total: number
  linked: number
  skipped: number
  upserted: number
  createdAt: Date
}


const PROJECTION_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(PROJECTION_MAP).map(([k, v]) => [v, k]),
)
const SPLIT_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(SPLIT_MAP).map(([k, v]) => [v, k]),
)

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams

  const TABS: Tab[] = ["players", "stats", "profiles"]
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "players"

  return (
    <div className="page-layout">
      <h1>Manage Players</h1>
      <PlayerPageTabs currentTab={tab}>
        {tab === "players" && (
          <Suspense fallback={<TableSkeleton rows={10} />}>
            <PlayersTableSection params={params} />
          </Suspense>
        )}
        {tab === "stats" && (
          <Suspense fallback={<SectionSkeleton />}>
            <StatsTabContent />
          </Suspense>
        )}
        {tab === "profiles" && (
          <Suspense fallback={<SectionSkeleton />}>
            <ProfilesTabContent />
          </Suspense>
        )}
      </PlayerPageTabs>
    </div>
  )
}

// ── Tab content: Profiles ──────────────────────────────────────────────────────

async function ProfilesTabContent() {
  const [playerMapUploads, playerUniverseUploads] = await Promise.all([
    prisma.playerMapImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, season: true, fileName: true, createdAt: true },
    }),
    prisma.playerUniverseUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, season: true, fileName: true, createdAt: true },
    }),
  ])

  return (
    <PlayerProfilesSection
      playerMapUploads={playerMapUploads}
      playerUniverseUploads={playerUniverseUploads}
    />
  )
}

// ── Tab content: Stats ─────────────────────────────────────────────────────────

async function StatsTabContent() {
  const recentStatUploads = await prisma.statUpload.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      season: true,
      playerType: true,
      projection: true,
      split: true,
      fileName: true,
      total: true,
      linked: true,
      skipped: true,
      upserted: true,
      createdAt: true,
    },
  })

  return <PlayerStatsSection recentStatUploads={recentStatUploads} />
}

// ── Players table (slow: player + stats queries) ───────────────────────────────

async function PlayersTableSection({
  params,
}: {
  params: Record<string, string | undefined>
}) {
  const [players, manualOverrides, statSeasons, playerExports] =
    await Promise.all([
      prisma.player.findMany({
        where: { deletedAt: null },
        orderBy: { playerName: "asc" },
        select: {
          id: true,
          ottoneuId: true,
          playerName: true,
          fgSpecialChar: true,
          firstName: true,
          lastName: true,
          active: true,
          birthday: true,
          team: true,
          mlbLevel: true,
          fangraphsId: true,
          bats: true,
          throws: true,
          universe: {
            where: { format: "ottoneu", deletedAt: null },
            select: { positions: true, fangraphsId: true },
            take: 1,
          },
          override: {
            select: {
              id: true,
              displayName: true,
              firstName: true,
              lastName: true,
              nickname: true,
              birthday: true,
              team: true,
              mlbLevel: true,
              league: true,
              active: true,
              bats: true,
              throws: true,
              positions: true,
              deletedAt: true,
            },
          },
        },
      }),
      // Manual overrides not yet linked to a Player
      prisma.playerOverride.findMany({
        where: { isManual: true, playerId: null, deletedAt: null },
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          nickname: true,
          birthday: true,
          team: true,
          mlbLevel: true,
          league: true,
          active: true,
          bats: true,
          throws: true,
          positions: true,
          fangraphsId: true,
          ottoneuId: true,
        },
      }),
      prisma.statUpload.findMany({
        select: { season: true, projection: true, split: true },
        orderBy: { season: "desc" },
        take: 500,
      }),
      prisma.dataExport.findMany({
        where: { scope: "Players", deletedAt: null },
        orderBy: { name: "asc" },
        select: { name: true },
      }),
    ])

  // ── Stats filter params ──────────────────────────────────────────────────

  const availableYears: number[] = [...new Set(statSeasons.map((r) => r.season))]

  const playerType =
    params.show === "pitchers"
      ? StatPlayerType.PITCHER
      : StatPlayerType.BATTER

  const sseRaw = params.sse ? Number(params.sse) : NaN
  const selectedSeason: number = availableYears.includes(sseRaw)
    ? sseRaw
    : (availableYears[0] ?? new Date().getFullYear())

  const seasonRows = statSeasons.filter((r) => r.season === selectedSeason)

  const availableProjections = Array.from(
    new Set(
      seasonRows
        .map((r) => PROJECTION_KEY[r.projection])
        .filter((k): k is string => k !== undefined),
    ),
  )

  const availableSplits = Array.from(new Set(seasonRows.map((r) => r.split)))
    .map((s) => SPLIT_KEY[s])
    .filter((k): k is string => k !== undefined)

  const defaultProjectionKey = availableProjections[0] ?? "None"
  const projectionKey =
    params.spr === "None"
      ? "None"
      : params.spr && availableProjections.includes(params.spr)
        ? params.spr
        : defaultProjectionKey
  const projection = PROJECTION_MAP[projectionKey] ?? StatProjection.None

  const splitKey =
    playerType === StatPlayerType.PITCHER
      ? "None"
      : params.ssp !== undefined && params.ssp in SPLIT_MAP
        ? params.ssp
        : "None"
  const split = SPLIT_MAP[splitKey]

  const playerStatSelect = {
    player: {
      select: {
        playerName: true,
        ottoneuId: true,
        fangraphsId: true,
        mlbLevel: true,
        team: true,
        active: true,
      },
    },
  } as const

  const rawStatRows = await (async () => {
    if (availableYears.length === 0) return []
    const baseWhere = { season: selectedSeason, playerType, ros: false, projection, deletedAt: null }
    if (playerType === StatPlayerType.PITCHER) {
      const rows = await prisma.playerStat.findMany({
        where: { ...baseWhere, split: { in: [StatSplit.None, StatSplit.Neutral] } },
        include: playerStatSelect,
        orderBy: { player: { playerName: "asc" } },
      })
      const rowMap = new Map<string, (typeof rows)[number]>()
      for (const r of rows) {
        if (!rowMap.has(r.playerId) || r.split === StatSplit.Neutral) rowMap.set(r.playerId, r)
      }
      return [...rowMap.values()].sort((a, b) => a.player.playerName.localeCompare(b.player.playerName))
    }
    return prisma.playerStat.findMany({ where: { ...baseWhere, split }, include: playerStatSelect, orderBy: { player: { playerName: "asc" } } })
  })()

  const statRows: StatRow[] = rawStatRows.map((r) => ({
    playerId: r.playerId,
    playerName: r.player.playerName,
    ottoneuId: r.player.ottoneuId,
    fangraphsId: r.player.fangraphsId,
    mlbLevel: r.player.mlbLevel,
    team: r.player.team,
    active: r.player.active,
    stats: r.stats as Record<string, number | string | null>,
  }))

  const statsFilter: StatsFilter = {
    season: selectedSeason,
    projection: projectionKey,
    split: splitKey,
  }

  const playerRows: PlayerRow[] = players.map((p) => {
    const ov = p.override?.deletedAt ? null : p.override
    const canonicalPositions = p.universe[0]?.positions ?? []
    const baseTeam = p.team
    const baseFgId = p.fangraphsId ?? p.universe[0]?.fangraphsId
    const derivedLevel = deriveLevelFromFgId(baseFgId ?? null) || null
    const derivedLeague = deriveLeagueFromTeam(baseTeam ?? null)
    return {
      id: p.id,
      ottoneuId: p.ottoneuId,
      // Display name: override.displayName > fgSpecialChar > playerName
      playerName: p.playerName,
      fgSpecialChar: ov?.displayName ?? p.fgSpecialChar,
      firstName: ov?.firstName ?? p.firstName,
      lastName: ov?.lastName ?? p.lastName,
      active: ov?.active ?? p.active,
      birthday: toISODate(ov?.birthday ?? p.birthday),
      team: ov?.team ?? baseTeam,
      mlbLevel: ov?.mlbLevel ?? derivedLevel,
      league: ov?.league ?? derivedLeague,
      nickname: ov?.nickname ?? null,
      fangraphsId: p.fangraphsId,
      bats: ov?.bats ?? p.bats,
      throws: ov?.throws ?? p.throws,
      ottoneuPositions: ov?.positions?.length
        ? ov.positions
        : canonicalPositions,
      universeFgId: p.universe[0]?.fangraphsId ?? null,
      overrideId: ov?.id ?? null,
      isManual: false,
      baseFields: {
        displayName: p.fgSpecialChar ?? p.playerName,
        firstName: p.firstName,
        lastName: p.lastName,
        birthday: toISODate(p.birthday),
        team: baseTeam,
        mlbLevel: derivedLevel,
        league: derivedLeague,
        active: p.active,
        bats: p.bats,
        throws: p.throws,
        positions: canonicalPositions,
      },
    }
  })

  // Build rows for manual overrides that haven't been auto-linked yet
  const manualRows: PlayerRow[] = manualOverrides.map((o) => ({
    id: o.id, // use override id as row id since there's no player record
    ottoneuId: o.ottoneuId,
    playerName:
      o.displayName ??
      [o.firstName, o.lastName].filter(Boolean).join(" ") ??
      "",
    fgSpecialChar: o.displayName,
    firstName: o.firstName,
    lastName: o.lastName,
    nickname: o.nickname,
    active: o.active ?? true,
    birthday: toISODate(o.birthday),
    team: o.team,
    mlbLevel: o.mlbLevel,
    league: o.league,
    fangraphsId: o.fangraphsId,
    bats: o.bats,
    throws: o.throws,
    ottoneuPositions: o.positions?.length ? o.positions : [],
    universeFgId: null,
    overrideId: o.id,
    isManual: true,
    baseFields: null,
  }))

  const allRows = [...playerRows, ...manualRows]

  const initialShow: "profiles" | "batters" | "pitchers" =
    params.show === "batters"
      ? "batters"
      : params.show === "pitchers"
        ? "pitchers"
        : "profiles"

  return (
    <PlayersTableAdmin
      data={allRows}
      statRows={statRows}
      availableYears={availableYears}
      availableProjections={availableProjections}
      availableSplits={availableSplits}
      statsFilter={statsFilter}
      initialShow={initialShow}
      playerExports={playerExports.map((e) => e.name)}
    />
  )
}

// ── Skeleton fallbacks ─────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}

export { TableSkeleton } from "@/components/table-skeleton"
