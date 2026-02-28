import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertLeagueRole } from "@/lib/auth-helpers";
import { LeagueMemberRole } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

async function resolveLeague(id: string, orgId: string) {
  return prisma.league.findFirst({
    where: { id, clerkOrgId: orgId, deletedAt: null },
  });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const league = await resolveLeague(id, orgId!);
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(league);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { orgId, userId } = await auth.protect();
  const denied = await assertLeagueRole(orgId!, userId!, [
    LeagueMemberRole.COMMISSIONER,
    LeagueMemberRole.CO_COMMISSIONER,
  ]);
  if (denied) return denied;
  const { id } = await params;

  const league = await resolveLeague(id, orgId!);
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { leagueName, leagueFormat, rosterConfig, isAuction, isH2H, leagueCap, seasons } = body;

  const updated = await prisma.league.update({
    where: { id },
    data: {
      ...(leagueName !== undefined && { leagueName }),
      ...(leagueFormat !== undefined && { leagueFormat }),
      ...(rosterConfig !== undefined && { rosterConfig }),
      ...(isAuction !== undefined && { isAuction }),
      ...(isH2H !== undefined && { isH2H }),
      ...(leagueCap !== undefined && { leagueCap }),
      ...(seasons !== undefined && { seasons }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { orgId, userId } = await auth.protect();
  const denied = await assertLeagueRole(orgId!, userId!, [LeagueMemberRole.COMMISSIONER]);
  if (denied) return denied;
  const { id } = await params;

  const league = await resolveLeague(id, orgId!);
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.league.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
