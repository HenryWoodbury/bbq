import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatSelect } from "@/lib/queries/formats"

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
      format: { select: formatSelect },
    },
  })

  return NextResponse.json(leagues)
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth.protect()

  const body = await request.json()
  const { leagueName, formatId, seasons } = body as {
    leagueName: string
    formatId: string
    seasons?: number[]
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "No active organization context" },
      { status: 400 },
    )
  }

  if (!leagueName || !formatId) {
    return NextResponse.json(
      { error: "leagueName and formatId are required" },
      { status: 400 },
    )
  }

  const leagueFormat = await prisma.leagueFormat.findUnique({
    where: { id: formatId },
  })
  if (!leagueFormat) {
    return NextResponse.json({ error: "Format not found" }, { status: 404 })
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
      formatId,
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
      format: { select: formatSelect },
    },
  })

  return NextResponse.json(league, { status: 201 })
}
