import { NextResponse } from "next/server"
import { StatPlayerType, StatSplit } from "@/generated/prisma/client"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { toISODate } from "@/lib/date"
import {
  type ActiveFilter,
  effectivePlayer,
  type LeagueFilter,
  levelFangraphsId,
  matchesPlayerFilters,
} from "@/lib/player-effective"
import { deduplicatePrimarySplits, PROJECTION_MAP } from "@/lib/stat-maps"
import { csvEscape } from "@/lib/csv"

const ACTIVE_FILTERS: ActiveFilter[] = ["all", "yes", "no"]
const LEAGUE_FILTERS: LeagueFilter[] = ["all", "mlb", "milb", "al", "nl"]

function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(csvEscape).join(",")
}

function getRawStat(stats: unknown, key: string): number | null {
  const v = (stats as Record<string, unknown>)?.[key]
  if (v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const seasonParam = Number(searchParams.get("season"))
  const projectionParam = searchParams.get("projection") ?? "None"
  const playerTypeParam = searchParams.get("playerType")
  const activeParam = searchParams.get("active") ?? "all"
  const leagueParam = searchParams.get("league") ?? "all"
  const formatParam = searchParams.get("format") ?? "csv"

  if (formatParam !== "csv" && formatParam !== "json") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }

  if (
    Number.isNaN(seasonParam) ||
    seasonParam < 2000 ||
    !(projectionParam in PROJECTION_MAP) ||
    (playerTypeParam !== "BATTER" && playerTypeParam !== "PITCHER")
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }

  // Reject unknown filter values rather than silently falling through to "all":
  // an export that quietly ignores a filter hands back more rows than asked for.
  if (
    !ACTIVE_FILTERS.includes(activeParam as ActiveFilter) ||
    !LEAGUE_FILTERS.includes(leagueParam as LeagueFilter)
  ) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }
  const filters = {
    active: activeParam as ActiveFilter,
    league: leagueParam as LeagueFilter,
  }

  const playerType =
    playerTypeParam === "PITCHER"
      ? StatPlayerType.PITCHER
      : StatPlayerType.BATTER
  const projection = PROJECTION_MAP[projectionParam]

  const isBatter = playerType === StatPlayerType.BATTER
  const typeLabel = isBatter ? "batters" : "pitchers"
  const filename = `batcast-${typeLabel}-${seasonParam}`

  // One header serves the populated and empty cases; they previously disagreed,
  // the empty CSV omitting the three stat columns entirely.
  const header = toCsvRow([
    "Ottoneu ID",
    "Fangraphs ID",
    "Name",
    "Birthday",
    "Positions",
    "Bats",
    "Throws",
    isBatter ? "wOBA" : "FIP",
    isBatter ? "wOBA vs LHP" : "wOBA vs LHB",
    isBatter ? "wOBA vs RHP" : "wOBA vs RHB",
  ])

  // The active/league filters are applied after profiles load, not here: they
  // must respect PlayerOverride, which is only reachable from the player query.
  const statsWhere = (split: StatSplit) => ({
    season: seasonParam,
    playerType,
    projection,
    split,
    deletedAt: null as null,
  })

  // The primary (unsplit) line is stored as None or Neutral depending on the
  // upload, so accept both for batters and pitchers alike — querying None alone
  // left the wOBA/FIP column empty for every row of a Neutral-sourced upload.
  const primaryWhere = {
    ...statsWhere(StatSplit.None),
    split: { in: [StatSplit.None, StatSplit.Neutral] },
  }

  const [primaryRows, vsLeftRows, vsRightRows] = await Promise.all([
    prisma.playerStat
      .findMany({
        where: primaryWhere,
        select: { playerId: true, stats: true, split: true },
      })
      .then((rows) =>
        deduplicatePrimarySplits(rows).map((r) => ({
          playerId: r.playerId,
          stats: r.stats,
        })),
      ),
    prisma.playerStat.findMany({
      where: statsWhere(StatSplit.VsLeft),
      select: { playerId: true, stats: true },
    }),
    prisma.playerStat.findMany({
      where: statsWhere(StatSplit.VsRight),
      select: { playerId: true, stats: true },
    }),
  ])

  const allPlayerIds = [
    ...new Set([
      ...primaryRows.map((r) => r.playerId),
      ...vsLeftRows.map((r) => r.playerId),
      ...vsRightRows.map((r) => r.playerId),
    ]),
  ]

  if (allPlayerIds.length === 0) {
    if (formatParam === "json") {
      return new Response("[]", {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      })
    }
    return new Response(header, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    })
  }

  // ── Fetch player profiles ──────────────────────────────────────────────────

  const players = await prisma.player.findMany({
    // A stat row outlives its player: the sync sweep soft-deletes Player without
    // touching PlayerStat, so a retired player would otherwise still export.
    where: { id: { in: allPlayerIds }, deletedAt: null },
    select: {
      id: true,
      ottoneuId: true,
      fangraphsId: true,
      playerName: true,
      fgSpecialChar: true,
      team: true,
      mlbLevel: true,
      active: true,
      birthday: true,
      bats: true,
      throws: true,
      override: {
        select: {
          displayName: true,
          team: true,
          mlbLevel: true,
          league: true,
          active: true,
          birthday: true,
          bats: true,
          throws: true,
          deletedAt: true,
        },
      },
      universe: {
        where: { format: "ottoneu", deletedAt: null },
        select: { positions: true, fangraphsId: true },
        take: 1,
      },
    },
  })

  // ── Resolve overrides, then filter ─────────────────────────────────────────
  // Filtering on the raw Player columns would drop players whose override makes
  // them match (and keep ones whose override makes them stop matching).

  // The resolved Fangraphs id serves both the level filter and the exported
  // column: Batcast joins on that column, so admitting a player through the
  // universe row and then emitting a blank id would hand back an unusable row.
  const sorted = players
    .map((p) => ({
      player: p,
      effective: effectivePlayer(p, p.override),
      fangraphsId: levelFangraphsId(
        p.fangraphsId,
        p.universe[0]?.fangraphsId,
      ),
    }))
    .filter(({ effective, fangraphsId }) =>
      matchesPlayerFilters(effective, fangraphsId, filters),
    )
    .sort((a, b) => a.effective.displayName.localeCompare(b.effective.displayName))

  // ── Build lookup maps ──────────────────────────────────────────────────────

  const primaryMap = new Map(primaryRows.map((r) => [r.playerId, r.stats]))
  const vsLeftMap = new Map(vsLeftRows.map((r) => [r.playerId, r.stats]))
  const vsRightMap = new Map(vsRightRows.map((r) => [r.playerId, r.stats]))

  // ── Build player records ───────────────────────────────────────────────────

  const playerRecords = sorted.map(({ player: p, effective, fangraphsId }) => {
    const positions = p.universe[0]?.positions.join("/") ?? null

    const mainStat = isBatter
      ? getRawStat(primaryMap.get(p.id), "wOBA")
      : getRawStat(primaryMap.get(p.id), "FIP")
    const vsLeft = getRawStat(vsLeftMap.get(p.id), "wOBA")
    const vsRight = getRawStat(vsRightMap.get(p.id), "wOBA")

    return {
      ottoneuId: p.ottoneuId,
      fangraphsId,
      name: effective.displayName,
      birthday: toISODate(effective.birthday),
      positions,
      bats: effective.bats,
      throws: effective.throws,
      ...(isBatter ? { wOBA: mainStat } : { FIP: mainStat }),
      wOBAVsLeft: vsLeft,
      wOBAVsRight: vsRight,
    }
  })

  // ── JSON ───────────────────────────────────────────────────────────────────

  if (formatParam === "json") {
    return new Response(JSON.stringify(playerRecords, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    })
  }

  // ── CSV ────────────────────────────────────────────────────────────────────

  const dataRows = playerRecords.map((r) =>
    toCsvRow([
      r.ottoneuId,
      r.fangraphsId,
      r.name,
      r.birthday,
      r.positions,
      r.bats,
      r.throws,
      isBatter
        ? (r as { wOBA: number | null }).wOBA
        : (r as { FIP: number | null }).FIP,
      r.wOBAVsLeft,
      r.wOBAVsRight,
    ]),
  )

  const csv = [header, ...dataRows].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  })
}
