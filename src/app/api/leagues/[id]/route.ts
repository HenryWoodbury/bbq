import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { LeagueMemberRole } from "@/generated/prisma/client"
import { assertLeagueRole } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { templateSelect } from "@/lib/queries/templates"

type Params = { params: Promise<{ id: string }> }

async function resolveLeague(id: string, userId: string) {
  const league = await prisma.league.findFirst({
    where: { id, deletedAt: null },
    include: { template: { select: templateSelect } },
  })
  if (!league) return null
  const member = await prisma.leagueMember.findUnique({
    where: { clerkUserId_leagueId: { clerkUserId: userId, leagueId: id } },
    select: { role: true },
  })
  return member ? league : null
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
  const { leagueName, templateId, seasons } = body as {
    leagueName?: string
    templateId?: string
    seasons?: number[]
  }

  if (templateId !== undefined) {
    const template = await prisma.leagueTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
  }

  const updated = await prisma.league.update({
    where: { id },
    data: {
      ...(leagueName !== undefined && { leagueName }),
      ...(templateId !== undefined && { templateId }),
      ...(seasons !== undefined && { seasons }),
    },
    include: { template: { select: templateSelect } },
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

  await prisma.league.update({ where: { id }, data: { deletedAt: new Date() } })

  return new NextResponse(null, { status: 204 })
}
