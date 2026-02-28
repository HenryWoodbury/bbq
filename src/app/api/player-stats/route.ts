import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  await auth.protect();

  const { searchParams } = request.nextUrl;
  const playerId = searchParams.get("playerId");
  const season = searchParams.get("season");

  const stats = await prisma.playerStat.findMany({
    where: {
      deletedAt: null,
      ...(playerId ? { playerId } : {}),
      ...(season ? { season: parseInt(season, 10) } : {}),
    },
    include: { player: { select: { id: true, playerName: true, playerId: true } } },
    orderBy: [{ season: "desc" }, { player: { playerName: "asc" } }],
  });

  return NextResponse.json({ data: stats, total: stats.length });
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { playerId, season, mlbTeam, stats } = body;

  if (!playerId || !season || !stats) {
    return NextResponse.json({ error: "playerId, season, and stats are required" }, { status: 400 });
  }

  const stat = await prisma.playerStat.upsert({
    where: { playerId_season: { playerId, season } },
    update: { mlbTeam, stats },
    create: { playerId, season, mlbTeam, stats },
  });

  return NextResponse.json(stat, { status: 201 });
}
