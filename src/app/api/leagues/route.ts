import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { orgId } = await auth.protect();

  const league = await prisma.league.findFirst({
    where: { clerkOrgId: orgId!, deletedAt: null },
    include: { teams: { where: { deletedAt: null } }, members: true },
  });

  if (!league) return NextResponse.json({ error: "No league found for this organization" }, { status: 404 });

  return NextResponse.json(league);
}

export async function POST(request: NextRequest) {
  const { orgId, userId } = await auth.protect();

  const body = await request.json();
  const { leagueName, leagueFormat, rosterConfig, isAuction, isH2H, leagueCap, seasons } = body;

  if (!leagueName || !rosterConfig) {
    return NextResponse.json({ error: "leagueName and rosterConfig are required" }, { status: 400 });
  }

  const existing = await prisma.league.findUnique({ where: { clerkOrgId: orgId! } });
  if (existing) {
    return NextResponse.json({ error: "A league already exists for this organization" }, { status: 409 });
  }

  const league = await prisma.league.create({
    data: {
      clerkOrgId: orgId!,
      leagueName,
      leagueFormat: leagueFormat ?? null,
      rosterConfig,
      isAuction: isAuction ?? false,
      isH2H: isH2H ?? false,
      leagueCap: leagueCap ?? null,
      seasons: seasons ?? [],
      members: {
        create: {
          clerkUserId: userId!,
          role: "COMMISSIONER",
        },
      },
    },
    include: { members: true },
  });

  return NextResponse.json(league, { status: 201 });
}
