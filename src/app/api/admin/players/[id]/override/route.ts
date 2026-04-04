import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const overrideSchema = z.object({
  displayName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(), // ISO date "YYYY-MM-DD"
  team: z.string().nullable().optional(),
  mlbLevel: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  bats: z.string().nullable().optional(),
  throws: z.string().nullable().optional(),
  positions: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  // Verify player exists
  const player = await prisma.player.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!player)
    return NextResponse.json({ error: "Player not found" }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = overrideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const override = await prisma.playerOverride.upsert({
    where: { playerId: id },
    create: {
      playerId: id,
      isManual: false,
      displayName: data.displayName ?? null,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      nickname: data.nickname ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      team: data.team ?? null,
      mlbLevel: data.mlbLevel ?? null,
      active: data.active ?? null,
      bats: data.bats ?? null,
      throws: data.throws ?? null,
      positions: data.positions ?? [],
      deletedAt: null,
    },
    update: {
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
      team: data.team,
      mlbLevel: data.mlbLevel,
      active: data.active,
      bats: data.bats,
      throws: data.throws,
      positions: data.positions,
      deletedAt: null,
    },
    select: { id: true, playerId: true, updatedAt: true },
  })

  return NextResponse.json(override)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const existing = await prisma.playerOverride.findUnique({
    where: { playerId: id },
    select: { id: true },
  })
  if (!existing)
    return NextResponse.json({ error: "Override not found" }, { status: 404 })

  await prisma.playerOverride.update({
    where: { playerId: id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
