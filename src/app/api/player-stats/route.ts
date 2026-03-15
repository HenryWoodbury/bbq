import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import type { StatPlayerType, StatSplit } from "@/generated/prisma/client"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const VALID_SPLITS = new Set(["None", "VsLeft", "VsRight"])
const VALID_PLAYER_TYPES = new Set(["BATTER", "PITCHER"])

export async function GET(request: NextRequest) {
  await auth.protect()

  const { searchParams } = request.nextUrl
  const playerId = searchParams.get("playerId")
  const season = searchParams.get("season")
  const playerTypeParam = searchParams.get("playerType")
  const projectedParam = searchParams.get("projected")
  const neutralizedParam = searchParams.get("neutralized")
  const splitParam = searchParams.get("split")

  const stats = await prisma.playerStat.findMany({
    where: {
      deletedAt: null,
      ...(playerId ? { playerId } : {}),
      ...(season ? { season: parseInt(season, 10) } : {}),
      ...(playerTypeParam !== null && VALID_PLAYER_TYPES.has(playerTypeParam)
        ? { playerType: playerTypeParam as StatPlayerType }
        : {}),
      ...(projectedParam !== null ? { projected: projectedParam === "true" } : {}),
      ...(neutralizedParam !== null
        ? { neutralized: neutralizedParam === "true" }
        : {}),
      ...(splitParam !== null && VALID_SPLITS.has(splitParam)
        ? { split: splitParam as StatSplit }
        : {}),
    },
    include: {
      player: { select: { id: true, playerName: true, sfbbId: true } },
    },
    orderBy: [{ season: "desc" }, { player: { playerName: "asc" } }],
  })

  return NextResponse.json({ data: stats, total: stats.length })
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json()
  const { playerId, season, playerType, projected, neutralized, split, mlbTeam, stats } = body

  if (!playerId || !season || !stats) {
    return NextResponse.json(
      { error: "playerId, season, and stats are required" },
      { status: 400 },
    )
  }

  const stat = await prisma.playerStat.upsert({
    where: {
      playerId_season_playerType_projected_neutralized_split: {
        playerId,
        season,
        playerType: playerType ?? "BATTER",
        projected: projected ?? false,
        neutralized: neutralized ?? false,
        split: split ?? "None",
      },
    },
    update: { mlbTeam, stats },
    create: {
      playerId,
      season,
      playerType: playerType ?? "BATTER",
      projected: projected ?? false,
      neutralized: neutralized ?? false,
      split: split ?? "None",
      mlbTeam,
      stats,
    },
  })

  return NextResponse.json(stat, { status: 201 })
}
