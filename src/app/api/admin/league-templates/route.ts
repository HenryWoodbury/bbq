import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const templateSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(["ESPN", "Ottoneu", "Custom"]),
  playType: z.enum(["H2H", "Season"]),
  scoring: z.enum(["FiveX5", "FourX4", "Fangraphs", "SABR", "Points"]),
  draftMode: z.enum(["Live", "Slow"]),
  draftType: z.enum(["Snake", "Auction"]),
  teams: z.number().int().positive().default(12),
  rosterSize: z.number().int().positive(),
  cap: z.number().int().positive().nullable(),
  rosters: z.array(z.string()),
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

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const templates = await prisma.leagueTemplate.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { ...TEMPLATE_SELECT, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = templateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
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

  const existing = await prisma.leagueTemplate.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json(
      { error: `A template named "${name}" already exists` },
      { status: 409 },
    )
  }

  const template = await prisma.leagueTemplate.create({
    data: {
      name,
      platform,
      playType,
      scoring,
      draftMode,
      draftType,
      teams,
      rosterSize,
      cap: cap ?? null,
      rosters,
      description: description ?? null,
      rulesText: rulesText ?? null,
      isActive: isActive ?? true,
    },
    select: { ...TEMPLATE_SELECT, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(template, { status: 201 })
}
