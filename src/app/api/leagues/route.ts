import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { templateSelect } from "@/lib/queries/templates"

export async function GET() {
  const { userId } = await auth.protect()

  const leagues = await prisma.league.findMany({
    where: {
      members: { some: { clerkUserId: userId, deletedAt: null } },
      deletedAt: null,
    },
    orderBy: { leagueName: "asc" },
    include: {
      teams: { where: { deletedAt: null } },
      members: { where: { deletedAt: null } },
      template: { select: templateSelect },
    },
  })

  return NextResponse.json(leagues)
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth.protect()

  const body = await request.json()
  const { leagueName, templateId, seasons } = body as {
    leagueName: string
    templateId: string
    seasons?: number[]
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "No active organization context" },
      { status: 400 },
    )
  }

  if (!leagueName || !templateId) {
    return NextResponse.json(
      { error: "leagueName and templateId are required" },
      { status: 400 },
    )
  }

  const template = await prisma.leagueTemplate.findUnique({
    where: { id: templateId },
  })
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  const existing = await prisma.league.findUnique({
    where: { clerkOrgId: orgId },
  })
  if (existing) {
    return NextResponse.json(
      { error: "A league already exists for this organization" },
      { status: 409 },
    )
  }

  const league = await prisma.league.create({
    data: {
      clerkOrgId: orgId,
      leagueName,
      templateId,
      seasons: seasons ?? [],
      members: {
        create: {
          clerkUserId: userId,
          role: "COMMISSIONER",
        },
      },
    },
    include: {
      members: true,
      template: { select: templateSelect },
    },
  })

  return NextResponse.json(league, { status: 201 })
}
