import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { buildManualPlayerData } from "@/lib/manual-players"
import { prisma } from "@/lib/prisma"
import { reconcilePlayerIds } from "@/lib/reconcile-player-ids"
import { normalizeTeamCode } from "@/lib/team-codes"

const manualSchema = z
  .object({
    displayName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    nickname: z.string().nullable().optional(),
    birthday: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    mlbLevel: z.string().nullable().optional(),
    league: z.string().nullable().optional(),
    active: z.boolean().nullable().optional(),
    bats: z.string().nullable().optional(),
    throws: z.string().nullable().optional(),
    positions: z.array(z.string()).optional(),
    fangraphsId: z.string().nullable().optional(),
    mlbamId: z.number().int().nullable().optional(),
    ottoneuId: z.number().int().nullable().optional(),
  })
  // Trim-aware: a whitespace-only name is truthy, so a bare `||` chain let it
  // through and `manualPlayerName` then fell back to "Unnamed Player" — a
  // silently misnamed player rather than a rejected request.
  .refine(
    (d) => [d.displayName, d.firstName, d.lastName].some((v) => v?.trim()),
    { message: "displayName or firstName+lastName is required" },
  )

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = manualSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const team = normalizeTeamCode(data.team ?? null)
  const birthday = data.birthday ? new Date(data.birthday) : null
  const positions = data.positions ?? []

  // A manual player needs a canonical Player row: PlayerStat.playerId is a
  // required FK to Player, so an override on its own can never carry
  // projections and stays invisible to the stats views and every export.
  const created = await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: buildManualPlayerData({ ...data, team, birthday, positions }),
      select: { id: true },
    })

    const override = await tx.playerOverride.create({
      data: {
        isManual: true,
        playerId: player.id,
        displayName: data.displayName ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        nickname: data.nickname ?? null,
        birthday,
        team,
        mlbLevel: data.mlbLevel ?? null,
        league: data.league ?? null,
        active: data.active ?? null,
        bats: data.bats ?? null,
        throws: data.throws ?? null,
        positions,
        fangraphsId: data.fangraphsId ?? null,
        mlbamId: data.mlbamId ?? null,
        ottoneuId: data.ottoneuId ?? null,
      },
      select: { id: true, isManual: true, createdAt: true },
    })

    return { ...override, playerId: player.id }
  })

  // Links any matching PlayerUniverse row to the new Player — exports read
  // positions from universe, not the override — and folds the synthetic player
  // into the real one if this id is already in the SFBB map.
  const reconciled = await reconcilePlayerIds()

  return NextResponse.json({ ...created, reconciled }, { status: 201 })
}
