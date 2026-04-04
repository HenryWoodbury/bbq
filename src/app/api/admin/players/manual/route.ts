import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const manualSchema = z
  .object({
    displayName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    nickname: z.string().nullable().optional(),
    birthday: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    mlbLevel: z.string().nullable().optional(),
    active: z.boolean().nullable().optional(),
    bats: z.string().nullable().optional(),
    throws: z.string().nullable().optional(),
    positions: z.array(z.string()).optional(),
    fangraphsId: z.string().nullable().optional(),
    mlbamId: z.number().int().nullable().optional(),
    ottoneuId: z.number().int().nullable().optional(),
  })
  .refine((d) => d.displayName || d.firstName || d.lastName, {
    message: "displayName or firstName+lastName is required",
  })

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = manualSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const override = await prisma.playerOverride.create({
    data: {
      isManual: true,
      playerId: null,
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
      fangraphsId: data.fangraphsId ?? null,
      mlbamId: data.mlbamId ?? null,
      ottoneuId: data.ottoneuId ?? null,
    },
    select: { id: true, isManual: true, createdAt: true },
  })

  return NextResponse.json(override, { status: 201 })
}
