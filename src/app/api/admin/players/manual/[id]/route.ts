import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { isManualSfbbId, manualPlayerName } from "@/lib/manual-players"
import { prisma } from "@/lib/prisma"
import { normalizeTeamCode } from "@/lib/team-codes"

const updateSchema = z.object({
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
})

/** Patch semantics: `undefined` leaves the stored value alone, `null` clears it. */
function patched<T>(next: T | null | undefined, current: T | null): T | null {
  return next !== undefined ? next : current
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const existing = await prisma.playerOverride.findUnique({
    where: { id },
    select: {
      id: true,
      isManual: true,
      deletedAt: true,
      displayName: true,
      firstName: true,
      lastName: true,
      birthday: true,
      team: true,
      mlbLevel: true,
      active: true,
      bats: true,
      throws: true,
      positions: true,
      player: { select: { id: true, sfbbId: true } },
    },
  })
  if (!existing || !existing.isManual || existing.deletedAt !== null)
    return NextResponse.json(
      { error: "Manual player not found" },
      { status: 404 },
    )

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const birthday =
    data.birthday !== undefined
      ? data.birthday
        ? new Date(data.birthday)
        : null
      : undefined
  const team =
    data.team !== undefined ? normalizeTeamCode(data.team) : undefined

  const updated = await prisma.$transaction(async (tx) => {
    const override = await tx.playerOverride.update({
      where: { id },
      data: {
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
        birthday,
        team,
        mlbLevel: data.mlbLevel,
        league: data.league,
        active: data.active,
        bats: data.bats,
        throws: data.throws,
        positions: data.positions,
      },
      select: { id: true, updatedAt: true },
    })

    // For a synthetic player the Player row is the manual data, not an upstream
    // source — keep it in step so exports (which filter on Player.active and
    // Player.team, and read Player.fgSpecialChar) reflect the edit.
    const player = existing.player
    if (player && isManualSfbbId(player.sfbbId)) {
      const displayName = patched(data.displayName, existing.displayName)
      const firstName = patched(data.firstName, existing.firstName)
      const lastName = patched(data.lastName, existing.lastName)
      const active = patched(data.active, existing.active)
      await tx.player.update({
        where: { id: player.id },
        data: {
          playerName: manualPlayerName({ displayName, firstName, lastName }),
          fgSpecialChar: displayName,
          firstName,
          lastName,
          birthday: patched(birthday, existing.birthday),
          team: patched(team, existing.team),
          mlbLevel: patched(data.mlbLevel, existing.mlbLevel),
          ...(active !== null ? { active } : {}),
          bats: patched(data.bats, existing.bats),
          throws: patched(data.throws, existing.throws),
          positions: data.positions ?? existing.positions,
        },
      })
    }

    return override
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const existing = await prisma.playerOverride.findUnique({
    where: { id },
    select: {
      id: true,
      isManual: true,
      deletedAt: true,
      player: { select: { id: true, sfbbId: true } },
    },
  })
  // Same liveness test as PATCH: an already-retired manual player is gone as far
  // as both endpoints are concerned. Without it a second DELETE moves the
  // retirement timestamp and re-retires stats that were already retired.
  if (!existing || !existing.isManual || existing.deletedAt !== null)
    return NextResponse.json(
      { error: "Manual player not found" },
      { status: 404 },
    )

  const deletedAt = new Date()
  const player = existing.player

  await prisma.$transaction(async (tx) => {
    await tx.playerOverride.update({ where: { id }, data: { deletedAt } })
    // Retire the synthetic Player alongside it. A real SFBB player that a
    // manual add was later merged into must survive — only the manual record
    // is being removed.
    if (player && isManualSfbbId(player.sfbbId)) {
      await tx.player.update({ where: { id: player.id }, data: { deletedAt } })
      await tx.playerStat.updateMany({
        where: { playerId: player.id, deletedAt: null },
        data: { deletedAt },
      })
    }
  })

  return NextResponse.json({ ok: true })
}
