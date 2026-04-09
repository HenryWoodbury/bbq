import { Suspense } from "react"
import type {
  PlayerRow,
  StatRow,
  StatsFilter,
} from "@/components/players-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  StatPlayerType,
  StatProjection,
  StatSplit,
} from "@/generated/prisma/client"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PROJECTION_MAP } from "@/lib/stat-maps"
import { deriveLeagueFromTeam, deriveLevelFromFgId } from "@/lib/team-codes"
import { PlayersSync } from "./players-sync"
import { PlayersTableAdmin } from "./players-table-admin"

export const metadata = { title: "Manage Players — BBQ" }

export type StatUploadRow = {
  id: string
  season: number
  playerType: string
  projection: string
  split: string
  total: number
  linked: number
  skipped: number
  upserted: number
  createdAt: Date
}

export type SyncStatus = {
  lastSyncedPlayer: {
    updatedAt: Date
  } | null
  lastUploadedPlayerMap: {
    createdAt: Date
  } | null
  lastUploadedUniverse: {
    updatedAt: Date
  } | null
  lastUploadedStats: {
    createdAt: Date
  } | null
  recentStatUploads: StatUploadRow[]
}

const SPLIT_MAP: Record<string, StatSplit> = {
  None: StatSplit.None,
  VsLeft: StatSplit.VsLeft,
  VsRight: StatSplit.VsRight,
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

  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Players</h1>
      <section className="mt-2">
        <Suspense fallback={<SyncStatusSkeleton />}>
          <SyncStatusSection />
        </Suspense>
      </section>
      <section className="mt-6">
        <Suspense fallback={<TableSkeleton rows={10} />}>
          <PlayersTableSection params={params} />
        </Suspense>
      </section>
    </div>
  )
}

// ── Sync status (fast: 4 metadata queries) ─────────────────────────────────────

async function SyncStatusSection() {
  const [
    lastSyncedPlayer,
    lastUploadedPlayerMap,
    lastUploadedUniverse,
    recentStatUploads,
  ] = await Promise.all([
    prisma.player.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.playerMapImport.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.playerUniverse.findFirst({
      where: { format: "ottoneu", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.statUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        season: true,
        playerType: true,
        projection: true,
        split: true,
        total: true,
        linked: true,
        skipped: true,
        upserted: true,
        createdAt: true,
      },
    }),
  ])

  return (
    <PlayersSync
      status={{
        lastSyncedPlayer,
        lastUploadedPlayerMap,
        lastUploadedUniverse,
        lastUploadedStats: recentStatUploads[0] ?? null,
        recentStatUploads,
      }}
    />
  )
}

// ── Players table (slow: player + stats queries) ───────────────────────────────

async function PlayersTableSection({
  params,
}: {
  params: Record<string, string | undefined>
}) {
  const [players, manualOverrides, statSeasons] = await Promise.all([
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
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "desc" },
    }),
  ])

  // ── Stats filter params ──────────────────────────────────────────────────
  const availableYears = statSeasons.map((s) => s.season)
  const playerType =
    params.spt === "PITCHER" ? StatPlayerType.PITCHER : StatPlayerType.BATTER
  const season = availableYears.includes(Number(params.sse))
    ? Number(params.sse)
    : (availableYears[0] ?? new Date().getFullYear())
  const [seasonProjectionRows, seasonSplitRows] =
    availableYears.length > 0
      ? await Promise.all([
          prisma.statUpload.findMany({
            where: { season },
            select: { projection: true },
            distinct: ["projection"],
          }),
          prisma.statUpload.findMany({
            where: { season },
            select: { split: true },
            distinct: ["split"],
          }),
        ])
      : [[], []]

  const availableProjections = seasonProjectionRows
    .map((r) => PROJECTION_KEY[r.projection])
    .filter((k): k is string => k !== undefined)

  const availableSplits = seasonSplitRows
    .map((r) => SPLIT_KEY[r.split])
    .filter((k): k is string => k !== undefined)

  const defaultProjectionKey = availableProjections[0] ?? "None"
  const projectionKey =
    params.spr && availableProjections.includes(params.spr)
      ? params.spr
      : defaultProjectionKey
  const splitKey =
    params.ssp !== undefined && params.ssp in SPLIT_MAP ? params.ssp : "None"
  const projection = PROJECTION_MAP[projectionKey] ?? StatProjection.None
  const split = SPLIT_MAP[splitKey]

  const rawStatRows =
    availableYears.length > 0
      ? await prisma.playerStat.findMany({
          where: {
            season,
            playerType,
            projection,
            split,
            deletedAt: null,
          },
          include: {
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
          },
          orderBy: { player: { playerName: "asc" } },
        })
      : []

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
    playerType,
    season,
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
      birthday:
        (ov?.birthday ?? p.birthday)?.toISOString().slice(0, 10) ?? null,
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
        birthday: p.birthday?.toISOString().slice(0, 10) ?? null,
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
    birthday: o.birthday?.toISOString().slice(0, 10) ?? null,
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

  const initialShow: "profiles" | "stats" =
    params.show === "stats" ? "stats" : "profiles"

  return (
    <PlayersTableAdmin
      data={allRows}
      statRows={statRows}
      availableYears={availableYears}
      availableProjections={availableProjections}
      availableSplits={availableSplits}
      statsFilter={statsFilter}
      initialShow={initialShow}
    />
  )
}

// ── Skeleton fallbacks ─────────────────────────────────────────────────────────

function SyncStatusSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-4 w-56" />
    </div>
  )
}

const SKELETON_ROW_KEYS = "abcdefghijklmnopqrstuvwxyz".split("")

export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="h-10 border-b border-border bg-muted/30" />
      {SKELETON_ROW_KEYS.slice(0, rows).map((key) => (
        <div
          key={key}
          className="flex gap-4 border-b border-border px-4 py-3 last:border-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}
