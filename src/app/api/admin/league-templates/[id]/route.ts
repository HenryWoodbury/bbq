import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  platform: z.enum(["ESPN", "Ottoneu", "Custom"]).optional(),
  playType: z.enum(["H2H", "Season"]).optional(),
  scoring: z.enum(["FiveX5", "FourX4", "Fangraphs", "SABR", "Points"]).optional(),
  draftMode: z.enum(["Live", "Slow"]).optional(),
  draftType: z.enum(["Snake", "Auction"]).optional(),
  teams: z.number().int().positive().optional(),
  rosterSize: z.number().int().positive().optional(),
  cap: z.number().int().positive().nullable().optional(),
  rosters: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  rulesText: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

const TEMPLATE_SELECT = {
  id: true,
  name: true,
  platform: true,
  playType: true,
  scoring: true,
  draftMode: true,
  draftType: true,
  teams: true,
  rosterSize: true,
  cap: true,
  rosters: true,
  isActive: true,
  version: true,
  description: true,
  rulesText: true,
} as const

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const template = await prisma.leagueTemplate.findFirst({
    where: { id, deletedAt: null },
    select: { ...TEMPLATE_SELECT, createdAt: true, updatedAt: true },
  })

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(template)
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

  const existing = await prisma.leagueTemplate.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { name, platform, playType, scoring, draftMode, draftType, teams, rosterSize, cap, rosters, description, rulesText, isActive } = parsed.data

  if (name !== undefined && name !== existing.name) {
    const nameConflict = await prisma.leagueTemplate.findUnique({ where: { name } })
    if (nameConflict) {
      return NextResponse.json({ error: `A template named "${name}" already exists` }, { status: 409 })
    }
  }

  const updated = await prisma.leagueTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(platform !== undefined && { platform }),
      ...(playType !== undefined && { playType }),
      ...(scoring !== undefined && { scoring }),
      ...(draftMode !== undefined && { draftMode }),
      ...(draftType !== undefined && { draftType }),
      ...(teams !== undefined && { teams }),
      ...(rosterSize !== undefined && { rosterSize, version: { increment: 1 } }),
      ...(cap !== undefined && { cap }),
      ...(rosters !== undefined && { rosters }),
      ...(description !== undefined && { description }),
      ...(rulesText !== undefined && { rulesText }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { ...TEMPLATE_SELECT, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.leagueTemplate.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.leagueTemplate.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ deleted: true })
}
