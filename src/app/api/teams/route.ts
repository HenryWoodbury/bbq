import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { orgId } = await auth.protect();

  const league = await prisma.league.findFirst({
    where: { clerkOrgId: orgId!, deletedAt: null },
  });
  if (!league) return NextResponse.json({ error: "No league for this organization" }, { status: 404 });

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id, deletedAt: null },
    include: { managers: true },
    orderBy: { teamName: "asc" },
  });

  return NextResponse.json({ data: teams, total: teams.length });
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth.protect();

  const league = await prisma.league.findFirst({
    where: { clerkOrgId: orgId!, deletedAt: null },
  });
  if (!league) return NextResponse.json({ error: "No league for this organization" }, { status: 404 });

  const body = await request.json();
  const { teamName, financeData } = body;

  if (!teamName) {
    return NextResponse.json({ error: "teamName is required" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      leagueId: league.id,
      teamName,
      financeData: financeData ?? { loans_in: 0, loans_out: 0, budget: league.leagueCap ?? 0, spent: 0 },
      managers: {
        create: { clerkUserId: userId!, isPrimary: true },
      },
    },
    include: { managers: true },
  });

  return NextResponse.json(team, { status: 201 });
}
