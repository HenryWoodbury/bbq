import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import {
  adminFormatSelect,
  FORMAT_DRAFT_MODE_VALUES,
  FORMAT_DRAFT_TYPE_VALUES,
  FORMAT_PLATFORM_VALUES,
  FORMAT_PLAY_TYPE_VALUES,
  FORMAT_SCORING_VALUES,
} from "@/lib/queries/formats"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  platform: z.enum(FORMAT_PLATFORM_VALUES).optional(),
  playType: z.enum(FORMAT_PLAY_TYPE_VALUES).optional(),
  scoring: z.enum(FORMAT_SCORING_VALUES).optional(),
  draftMode: z.enum(FORMAT_DRAFT_MODE_VALUES).optional(),
  draftType: z.enum(FORMAT_DRAFT_TYPE_VALUES).optional(),
  teams: z.number().int().positive().optional(),
  rosterSize: z.number().int().positive().optional(),
  cap: z.number().int().positive().nullable().optional(),
  rosters: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  rulesText: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})


type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const format = await prisma.leagueFormat.findFirst({
    where: { id, deletedAt: null },
    select: { ...adminFormatSelect, createdAt: true, updatedAt: true },
  })

  if (!format) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(format)
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.leagueFormat.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const {
    name,
    platform,
    playType,
    scoring,
    draftMode,
    draftType,
    teams,
    rosterSize,
    cap,
    rosters,
    description,
    rulesText,
    isActive,
  } = parsed.data

  if (name !== undefined && name !== existing.name) {
    const nameConflict = await prisma.leagueFormat.findUnique({
      where: { name },
    })
    if (nameConflict) {
      return NextResponse.json(
        { error: `A format named "${name}" already exists` },
        { status: 409 },
      )
    }
  }

  const updated = await prisma.leagueFormat.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(platform !== undefined && { platform }),
      ...(playType !== undefined && { playType }),
      ...(scoring !== undefined && { scoring }),
      ...(draftMode !== undefined && { draftMode }),
      ...(draftType !== undefined && { draftType }),
      ...(teams !== undefined && { teams }),
      ...(rosterSize !== undefined && {
        rosterSize,
        version: { increment: 1 },
      }),
      ...(cap !== undefined && { cap }),
      ...(rosters !== undefined && { rosters }),
      ...(description !== undefined && { description }),
      ...(rulesText !== undefined && { rulesText }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { ...adminFormatSelect, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.leagueFormat.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.leagueFormat.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ deleted: true })
}
