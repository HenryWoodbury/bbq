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

const formatSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(FORMAT_PLATFORM_VALUES),
  playType: z.enum(FORMAT_PLAY_TYPE_VALUES),
  scoring: z.enum(FORMAT_SCORING_VALUES),
  draftMode: z.enum(FORMAT_DRAFT_MODE_VALUES),
  draftType: z.enum(FORMAT_DRAFT_TYPE_VALUES),
  teams: z.number().int().positive().default(12),
  rosterSize: z.number().int().positive(),
  cap: z.number().int().positive().nullable(),
  rosters: z.array(z.string()),
  description: z.string().nullable().optional(),
  rulesText: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})


export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const formats = await prisma.leagueFormat.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { ...adminFormatSelect, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(formats)
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = formatSchema.safeParse(body)
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

  const existing = await prisma.leagueFormat.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json(
      { error: `A format named "${name}" already exists` },
      { status: 409 },
    )
  }

  const format = await prisma.leagueFormat.create({
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
    select: { ...adminFormatSelect, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(format, { status: 201 })
}
