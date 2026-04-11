import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const existing = await prisma.playerOverride.findUnique({
    where: { id },
    select: { id: true, isManual: true, deletedAt: true },
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

  const updated = await prisma.playerOverride.update({
    where: { id },
    data: {
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      birthday:
        data.birthday !== undefined
          ? data.birthday
            ? new Date(data.birthday)
            : null
          : undefined,
      team: data.team !== undefined ? normalizeTeamCode(data.team) : undefined,
      mlbLevel: data.mlbLevel,
      league: data.league,
      active: data.active,
      bats: data.bats,
      throws: data.throws,
      positions: data.positions,
    },
    select: { id: true, updatedAt: true },
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
    select: { id: true, isManual: true },
  })
  if (!existing || !existing.isManual)
    return NextResponse.json(
      { error: "Manual player not found" },
      { status: 404 },
    )

  await prisma.playerOverride.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
