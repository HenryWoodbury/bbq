import { NextResponse } from "next/server"
import {
  type Prisma,
  StatPlayerType,
  StatSplit,
} from "@/generated/prisma/client"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PROJECTION_MAP } from "@/lib/stat-maps"
import { AL_TEAM_CODES, NL_TEAM_CODES } from "@/lib/team-codes"

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v)
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

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

  const playerType =
    playerTypeParam === "PITCHER"
      ? StatPlayerType.PITCHER
      : StatPlayerType.BATTER
  const projection = PROJECTION_MAP[projectionParam]

  // ── Build player filter ────────────────────────────────────────────────────

  const playerFilter: Prisma.PlayerWhereInput = {}

  if (activeParam === "yes") playerFilter.active = true
  else if (activeParam === "no") playerFilter.active = false

  if (leagueParam === "milb") {
    playerFilter.fangraphsId = { startsWith: "sa" }
  } else if (leagueParam === "mlb") {
    playerFilter.AND = [
      { fangraphsId: { not: null } },
      { NOT: { fangraphsId: { startsWith: "sa" } } },
    ]
  } else if (leagueParam === "al") {
    playerFilter.team = { in: [...AL_TEAM_CODES] }
  } else if (leagueParam === "nl") {
    playerFilter.team = { in: [...NL_TEAM_CODES] }
  }

  const hasPlayerFilter = Object.keys(playerFilter).length > 0
  const statsWhere = (split: StatSplit) => ({
    season: seasonParam,
    playerType,
    projection,
    split,
    deletedAt: null as null,
    ...(hasPlayerFilter ? { player: playerFilter } : {}),
  })

  // ── Fetch all splits (union = all players with stats for any split) ─────────

  const [noneRows, vsLeftRows, vsRightRows] = await Promise.all([
    prisma.playerStat.findMany({
      where: statsWhere(StatSplit.None),
      select: { playerId: true, stats: true },
    }),
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
      ...noneRows.map((r) => r.playerId),
      ...vsLeftRows.map((r) => r.playerId),
      ...vsRightRows.map((r) => r.playerId),
    ]),
  ]

  if (allPlayerIds.length === 0) {
    if (formatParam === "json") {
      return new Response("[]", {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="batcast-${playerTypeParam.toLowerCase()}s-${seasonParam}.json"`,
        },
      })
    }
    return new Response(
      toCsvRow([
        "Ottoneu ID",
        "Fangraphs ID",
        "Name",
        "Birthday",
        "Positions",
        "Bats",
        "Throws",
      ]),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="batcast-${playerTypeParam.toLowerCase()}s-${seasonParam}.csv"`,
        },
      },
    )
  }

  // ── Fetch player profiles ──────────────────────────────────────────────────

  const players = await prisma.player.findMany({
    where: { id: { in: allPlayerIds } },
    select: {
      id: true,
      ottoneuId: true,
      fangraphsId: true,
      playerName: true,
      fgSpecialChar: true,
      birthday: true,
      bats: true,
      throws: true,
      override: {
        select: {
          displayName: true,
          birthday: true,
          bats: true,
          throws: true,
          deletedAt: true,
        },
      },
      universe: {
        where: { format: "ottoneu", deletedAt: null },
        select: { positions: true },
        take: 1,
      },
    },
  })

  // ── Build lookup maps ──────────────────────────────────────────────────────

  const noneMap = new Map(noneRows.map((r) => [r.playerId, r.stats]))
  const vsLeftMap = new Map(vsLeftRows.map((r) => [r.playerId, r.stats]))
  const vsRightMap = new Map(vsRightRows.map((r) => [r.playerId, r.stats]))

  // ── Sort by display name ───────────────────────────────────────────────────

  const sortedPlayers = [...players].sort((a, b) => {
    const nameA =
      (a.override?.deletedAt ? null : a.override?.displayName) ??
      a.fgSpecialChar ??
      a.playerName
    const nameB =
      (b.override?.deletedAt ? null : b.override?.displayName) ??
      b.fgSpecialChar ??
      b.playerName
    return nameA.localeCompare(nameB)
  })

  // ── Build player records ───────────────────────────────────────────────────

  const isBatter = playerType === StatPlayerType.BATTER
  const typeLabel = isBatter ? "batters" : "pitchers"

  const playerRecords = sortedPlayers.map((p) => {
    const ov = p.override?.deletedAt ? null : p.override
    const displayName = ov?.displayName ?? p.fgSpecialChar ?? p.playerName
    const birthday =
      (ov?.birthday ?? p.birthday)?.toISOString().slice(0, 10) ?? null
    const bats = ov?.bats ?? p.bats
    const throws_ = ov?.throws ?? p.throws
    const positions = p.universe[0]?.positions.join("/") ?? null

    const mainStat = isBatter
      ? getRawStat(noneMap.get(p.id), "wOBA")
      : getRawStat(noneMap.get(p.id), "FIP")
    const vsLeft = getRawStat(vsLeftMap.get(p.id), "wOBA")
    const vsRight = getRawStat(vsRightMap.get(p.id), "wOBA")

    return {
      ottoneuId: p.ottoneuId,
      fangraphsId: p.fangraphsId,
      name: displayName,
      birthday,
      positions,
      bats,
      throws: throws_,
      ...(isBatter ? { wOBA: mainStat } : { FIP: mainStat }),
      wOBAVsLeft: vsLeft,
      wOBAVsRight: vsRight,
    }
  })

  const filename = `batcast-${typeLabel}-${seasonParam}`

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

  const header = isBatter
    ? toCsvRow([
        "Ottoneu ID",
        "Fangraphs ID",
        "Name",
        "Birthday",
        "Positions",
        "Bats",
        "Throws",
        "wOBA",
        "wOBA vs LHP",
        "wOBA vs RHP",
      ])
    : toCsvRow([
        "Ottoneu ID",
        "Fangraphs ID",
        "Name",
        "Birthday",
        "Positions",
        "Bats",
        "Throws",
        "FIP",
        "wOBA vs LHB",
        "wOBA vs RHB",
      ])

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
