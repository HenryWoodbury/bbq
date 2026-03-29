import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { LeagueMemberRole } from "@/generated/prisma/client"
import { getLeagueRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

async function resolveTeam(id: string, userId: string) {
  const team = await prisma.team.findFirst({
    where: { id, deletedAt: null },
    include: {
      managers: { where: { deletedAt: null } },
      rosterHistory: { where: { deletedAt: null } },
      league: {
        include: {
          members: { where: { clerkUserId: userId, deletedAt: null } },
        },
      },
    },
  })
  return team?.league.members.length ? team : null
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const team = await resolveTeam(id, userId)
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(team)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const team = await resolveTeam(id, userId)
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = await getLeagueRole(team.leagueId, userId)

  const isCommissioner =
    role === LeagueMemberRole.COMMISSIONER ||
    role === LeagueMemberRole.CO_COMMISSIONER
  const isOwnTeamManager =
    (role === LeagueMemberRole.MANAGER ||
      role === LeagueMemberRole.CO_MANAGER) &&
    team.managers.some((m) => m.clerkUserId === userId)

  if (!isCommissioner && !isOwnTeamManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { teamName, currentRoster, financeData } = body

  const updated = await prisma.team.update({
    where: { id },
    data: {
      ...(teamName !== undefined && { teamName }),
      ...(currentRoster !== undefined && { currentRoster }),
      ...(financeData !== undefined && { financeData }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const team = await resolveTeam(id, userId)
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = await getLeagueRole(team.leagueId, userId)
  if (
    role !== LeagueMemberRole.COMMISSIONER &&
    role !== LeagueMemberRole.CO_COMMISSIONER
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.teamManager.updateMany({
      where: { teamId: id },
      data: { deletedAt: now },
    }),
    prisma.team.update({ where: { id }, data: { deletedAt: now } }),
  ])

  return new NextResponse(null, { status: 204 })
}
