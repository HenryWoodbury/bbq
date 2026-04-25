import { type NextRequest, NextResponse } from "next/server"
import { toISODate } from "@/lib/date"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export type UniverseSearchResult = {
  ottoneuId: number
  playerName: string
  fangraphsId: string | null
  mlbamId: number | null
  /** ISO "YYYY-MM-DD" or null */
  birthday: string | null
  positions: string[]
  /** true if already in Player table or has an active PlayerOverride */
  alreadyTracked: boolean
}

const UNIVERSE_SELECT = {
  ottoneuId: true,
  playerName: true,
  fangraphsId: true,
  mlbamId: true,
  birthday: true,
  positions: true,
  playerId: true,
} as const

export async function GET(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const rawId = searchParams.get("ottoneuId")?.trim() ?? ""
  const ottoneuId = rawId ? parseInt(rawId, 10) : null

  if (!q && (ottoneuId === null || Number.isNaN(ottoneuId))) {
    return NextResponse.json([] as UniverseSearchResult[])
  }

  const rows =
    ottoneuId !== null && !Number.isNaN(ottoneuId)
      ? await prisma.playerUniverse.findMany({
          where: { format: "ottoneu", deletedAt: null, ottoneuId },
          select: UNIVERSE_SELECT,
        })
      : await prisma.playerUniverse.findMany({
          where: { format: "ottoneu", deletedAt: null, playerName: { contains: q, mode: "insensitive" } },
          select: UNIVERSE_SELECT,
          orderBy: { playerName: "asc" },
          take: 30,
        })

  const ids = rows.map((r) => r.ottoneuId)
  const existingOverrides = ids.length
    ? await prisma.playerOverride.findMany({
        where: { ottoneuId: { in: ids }, deletedAt: null },
        select: { ottoneuId: true },
      })
    : []
  const overrideIds = new Set(existingOverrides.flatMap((o) => (o.ottoneuId !== null ? [o.ottoneuId] : [])))

  const results: UniverseSearchResult[] = rows.map((r) => ({
    ottoneuId: r.ottoneuId,
    playerName: r.playerName,
    fangraphsId: r.fangraphsId,
    mlbamId: r.mlbamId,
    birthday: toISODate(r.birthday),
    positions: r.positions,
    alreadyTracked: r.playerId !== null || overrideIds.has(r.ottoneuId),
  }))

  return NextResponse.json(results)
}
