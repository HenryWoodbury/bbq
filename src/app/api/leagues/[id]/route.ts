import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { LeagueMemberRole } from "@/generated/prisma/client"
import { assertLeagueRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { formatSelect } from "@/lib/queries/formats"

type Params = { params: Promise<{ id: string }> }

async function resolveLeague(id: string, userId: string) {
  const league = await prisma.league.findFirst({
    where: { id, deletedAt: null },
    include: {
      members: { where: { clerkUserId: userId, deletedAt: null } },
      format: { select: formatSelect },
    },
  })
  return league?.members.length ? league : null
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const league = await resolveLeague(id, userId)
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(league)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const denied = await assertLeagueRole(id, userId, [
    LeagueMemberRole.COMMISSIONER,
    LeagueMemberRole.CO_COMMISSIONER,
  ])
  if (denied) return denied

  const league = await prisma.league.findFirst({
    where: { id, deletedAt: null },
  })
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const { leagueName, formatId, seasons } = body as {
    leagueName?: string
    formatId?: string
    seasons?: number[]
  }

  if (formatId !== undefined) {
    const leagueFormat = await prisma.leagueFormat.findUnique({
      where: { id: formatId },
    })
    if (!leagueFormat) {
      return NextResponse.json({ error: "Format not found" }, { status: 404 })
    }
  }

  const updated = await prisma.league.update({
    where: { id },
    data: {
      ...(leagueName !== undefined && { leagueName }),
      ...(formatId !== undefined && { formatId }),
      ...(seasons !== undefined && { seasons }),
    },
    include: { format: { select: formatSelect } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { userId } = await auth.protect()
  const { id } = await params

  const denied = await assertLeagueRole(id, userId, [
    LeagueMemberRole.COMMISSIONER,
  ])
  if (denied) return denied

  const league = await prisma.league.findFirst({
    where: { id, deletedAt: null },
  })
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const teams = await prisma.team.findMany({
    where: { leagueId: id, deletedAt: null },
    select: { id: true },
  })
  const teamIds = teams.map((t) => t.id)
  const now = new Date()

  await prisma.$transaction([
    ...(teamIds.length > 0
      ? [
          prisma.teamManager.updateMany({
            where: { teamId: { in: teamIds } },
            data: { deletedAt: now },
          }),
        ]
      : []),
    prisma.team.updateMany({
      where: { leagueId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.leagueMember.updateMany({
      where: { leagueId: id },
      data: { deletedAt: now },
    }),
    prisma.league.update({ where: { id }, data: { deletedAt: now } }),
  ])

  return new NextResponse(null, { status: 204 })
}
