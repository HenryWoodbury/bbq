import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function resolveTeam(id: string, orgId: string) {
  const league = await prisma.league.findFirst({
    where: { clerkOrgId: orgId, deletedAt: null },
  });
  if (!league) return null;
  return prisma.team.findFirst({
    where: { id, leagueId: league.id, deletedAt: null },
    include: { managers: true, rosterHistory: { where: { deletedAt: null } } },
  });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const team = await resolveTeam(id, orgId!);
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(team);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const team = await resolveTeam(id, orgId!);
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { teamName, currentRoster, financeData } = body;

  const updated = await prisma.team.update({
    where: { id },
    data: {
      ...(teamName !== undefined && { teamName }),
      ...(currentRoster !== undefined && { currentRoster }),
      ...(financeData !== undefined && { financeData }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const team = await resolveTeam(id, orgId!);
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });

  return new NextResponse(null, { status: 204 });
}
