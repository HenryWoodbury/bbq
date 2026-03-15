import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { LeagueMemberRole } from "@/generated/prisma/client"
import { assertLeagueRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { userId } = await auth.protect()

  const leagueId = request.nextUrl.searchParams.get("leagueId")
  if (!leagueId)
    return NextResponse.json({ error: "leagueId required" }, { status: 400 })

  const member = await prisma.leagueMember.findUnique({
    where: { clerkUserId_leagueId: { clerkUserId: userId, leagueId } },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const teams = await prisma.team.findMany({
    where: { leagueId, deletedAt: null },
    include: { managers: true },
    orderBy: { teamName: "asc" },
  })

  return NextResponse.json({ data: teams, total: teams.length })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth.protect()

  const body = await request.json()
  const { leagueId, teamName, financeData } = body

  if (!leagueId)
    return NextResponse.json({ error: "leagueId required" }, { status: 400 })
  if (!teamName)
    return NextResponse.json({ error: "teamName is required" }, { status: 400 })

  const denied = await assertLeagueRole(leagueId, userId, [
    LeagueMemberRole.COMMISSIONER,
    LeagueMemberRole.CO_COMMISSIONER,
  ])
  if (denied) return denied

  const league = await prisma.league.findFirst({
    where: { id: leagueId, deletedAt: null },
    include: { template: { select: { cap: true } } },
  })
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const team = await prisma.team.create({
    data: {
      leagueId,
      teamName,
      financeData: financeData ?? {
        loans_in: 0,
        loans_out: 0,
        budget: league.template?.cap ?? 0,
        spent: 0,
      },
      managers: {
        create: { clerkUserId: userId, isPrimary: true },
      },
    },
    include: { managers: true },
  })

  return NextResponse.json(team, { status: 201 })
}
