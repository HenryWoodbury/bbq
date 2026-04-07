import { type NextRequest, NextResponse } from "next/server"
import {
  StatPlayerType,
  type StatProjection,
  StatSplit,
} from "@/generated/prisma/client"
import { assertAdmin } from "@/lib/auth-helpers"
import { chunk, parseCSVLine } from "@/lib/csv"
import { prisma } from "@/lib/prisma"
import { PROJECTION_MAP } from "@/lib/stat-maps"

const SKIP_COLUMNS_LC = new Set([
  "name",
  "team",
  "nameascii",
  "playerid",
  "mlbamid",
])

const SPLIT_MAP: Record<string, StatSplit> = {
  none: StatSplit.None,
  vs_left: StatSplit.VsLeft,
  vs_right: StatSplit.VsRight,
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const formData = await request.formData()
  const file = formData.get("file")
  const seasonStr = formData.get("season")
  const playerTypeStr = formData.get("playerType")
  const projectionStr = formData.get("projection")
  const splitStr = formData.get("split")

  if (
    !(file instanceof File) ||
    !seasonStr ||
    !playerTypeStr ||
    !projectionStr ||
    !splitStr
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    )
  }

  const season = parseInt(seasonStr as string, 10)
  if (Number.isNaN(season) || season < 2000 || season > 2100) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 })
  }

  const playerType =
    playerTypeStr === "PITCHER" ? StatPlayerType.PITCHER : StatPlayerType.BATTER
  const projection = PROJECTION_MAP[projectionStr as string]
  const split = SPLIT_MAP[splitStr as string]

  if (projection === undefined) {
    return NextResponse.json(
      { error: "Invalid projection value" },
      { status: 400 },
    )
  }
  if (split === undefined) {
    return NextResponse.json({ error: "Invalid split value" }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have a header and at least one data row" },
      { status: 400 },
    )
  }

  const headers = parseCSVLine(lines[0])
  const lc = headers.map((h) => h.toLowerCase())
  const playerIdIdx = lc.indexOf("playerid")
  const mlbamIdIdx = lc.indexOf("mlbamid")
  const teamIdx = lc.indexOf("team")

  if (playerIdIdx === -1 && mlbamIdIdx === -1) {
    return NextResponse.json(
      { error: "CSV must contain a PlayerId or MLBAMID column" },
      { status: 400 },
    )
  }

  type CsvRow = {
    fangraphsId: string | null
    mlbamId: number | null
    team: string | null
    stats: Record<string, number>
  }

  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)

    const fangraphsId =
      playerIdIdx !== -1 ? fields[playerIdIdx]?.trim() || null : null

    const mlbamRaw = mlbamIdIdx !== -1 ? fields[mlbamIdIdx]?.trim() : null
    const mlbamIdParsed = mlbamRaw ? parseInt(mlbamRaw, 10) : null
    const mlbamId =
      mlbamIdParsed !== null && !Number.isNaN(mlbamIdParsed)
        ? mlbamIdParsed
        : null

    const stats: Record<string, number> = {}
    for (let j = 0; j < headers.length; j++) {
      const col = headers[j]
      if (SKIP_COLUMNS_LC.has(lc[j])) continue
      const val = parseFloat(fields[j] ?? "")
      if (!Number.isNaN(val)) stats[col] = val
    }

    rows.push({
      fangraphsId,
      mlbamId,
      team: teamIdx !== -1 ? fields[teamIdx]?.trim() || null : null,
      stats,
    })
  }

  // Batch-fetch players by fangraphsId and mlbamId to avoid N+1
  const fgIds = rows
    .map((r) => r.fangraphsId)
    .filter((id): id is string => id !== null)
  const mlbamIds = rows
    .map((r) => r.mlbamId)
    .filter((id): id is number => id !== null)

  const [byFgId, byMlbamId] = await Promise.all([
    fgIds.length > 0
      ? prisma.player.findMany({
          where: { fangraphsId: { in: fgIds }, deletedAt: null },
          select: { id: true, fangraphsId: true },
        })
      : [],
    mlbamIds.length > 0
      ? prisma.player.findMany({
          where: { mlbamId: { in: mlbamIds }, deletedAt: null },
          select: { id: true, mlbamId: true },
        })
      : [],
  ])

  const fgMap = new Map(byFgId.map((p) => [p.fangraphsId, p.id]))
  const mlbamMap = new Map(byMlbamId.map((p) => [p.mlbamId, p.id]))

  type UpsertData = {
    playerId: string
    season: number
    playerType: StatPlayerType
    projection: StatProjection
    split: StatSplit
    mlbTeam: string | null
    stats: Record<string, number>
  }

  const toUpsert: UpsertData[] = []
  let skipped = 0
  const unmatchedSample: string[] = []

  for (const row of rows) {
    let playerId: string | undefined
    if (row.fangraphsId) playerId = fgMap.get(row.fangraphsId)
    if (!playerId && row.mlbamId !== null) playerId = mlbamMap.get(row.mlbamId)

    if (!playerId) {
      skipped++
      if (row.fangraphsId && unmatchedSample.length < 10)
        unmatchedSample.push(row.fangraphsId)
      continue
    }

    toUpsert.push({
      playerId,
      season,
      playerType,
      projection,
      split,
      mlbTeam: row.team,
      stats: row.stats,
    })
  }

  let upserted = 0
  try {
    for (const batch of chunk(toUpsert, 100)) {
      await prisma.$transaction(
        batch.map((data) =>
          prisma.playerStat.upsert({
            where: {
              playerId_season_playerType_projection_neutralized_split: {
                playerId: data.playerId,
                season: data.season,
                playerType: data.playerType,
                projection: data.projection,
                neutralized: false,
                split: data.split,
              },
            },
            update: {
              mlbTeam: data.mlbTeam,
              stats: data.stats,
              deletedAt: null,
            },
            create: {
              playerId: data.playerId,
              season: data.season,
              playerType: data.playerType,
              projection: data.projection,
              neutralized: false,
              split: data.split,
              mlbTeam: data.mlbTeam,
              stats: data.stats,
            },
          }),
        ),
      )
      upserted += batch.length
    }
    const upload = await prisma.statUpload.create({
      data: {
        season,
        playerType,
        projection,
        split,
        total: rows.length,
        linked: toUpsert.length,
        skipped,
        upserted,
      },
    })

    return NextResponse.json({
      total: rows.length,
      linked: toUpsert.length,
      skipped,
      upserted,
      unmatchedSample,
      uploadedAt: upload.createdAt.toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Database error: ${message}` },
      { status: 500 },
    )
  }
}
