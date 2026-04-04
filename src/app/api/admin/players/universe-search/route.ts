import { type NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma/client"
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

type UniverseRow = {
  ottoneu_id: number
  player_name: string
  fangraphs_id: string | null
  mlbam_id: number | null
  birthday: Date | null
  positions: string[]
  player_id: string | null
}

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

  let rows: UniverseRow[]

  if (ottoneuId !== null && !Number.isNaN(ottoneuId)) {
    // Exact ID lookup — Prisma findMany is fine here
    const found = await prisma.playerUniverse.findMany({
      where: { format: "ottoneu", deletedAt: null, ottoneuId },
      select: {
        ottoneuId: true,
        playerName: true,
        fangraphsId: true,
        mlbamId: true,
        birthday: true,
        positions: true,
        playerId: true,
      },
    })
    rows = found.map((r) => ({
      ottoneu_id: r.ottoneuId,
      player_name: r.playerName,
      fangraphs_id: r.fangraphsId,
      mlbam_id: r.mlbamId,
      birthday: r.birthday,
      positions: r.positions,
      player_id: r.playerId,
    }))
  } else {
    // Name search — use unaccent() for accent-insensitive matching
    rows = await prisma.$queryRaw<UniverseRow[]>`
      SELECT ottoneu_id, player_name, fangraphs_id, mlbam_id, birthday, positions, player_id
      FROM player_universe
      WHERE format = 'ottoneu'
        AND deleted_at IS NULL
        AND unaccent(player_name) ILIKE unaccent(${`%${q}%`})
      ORDER BY player_name ASC
      LIMIT 30
    `
  }

  const ids = rows.map((r) => r.ottoneu_id)
  const existingOverrides = ids.length
    ? await prisma.playerOverride.findMany({
        where: { ottoneuId: { in: ids }, deletedAt: null },
        select: { ottoneuId: true },
      })
    : []
  const overrideIds = new Set(
    existingOverrides.flatMap((o) =>
      o.ottoneuId !== null ? [o.ottoneuId] : [],
    ),
  )

  const results: UniverseSearchResult[] = rows.map((r) => ({
    ottoneuId: r.ottoneu_id,
    playerName: r.player_name,
    fangraphsId: r.fangraphs_id,
    mlbamId: r.mlbam_id,
    birthday: r.birthday?.toISOString().slice(0, 10) ?? null,
    positions: r.positions,
    alreadyTracked: r.player_id !== null || overrideIds.has(r.ottoneu_id),
  }))

  return NextResponse.json(results)
}
