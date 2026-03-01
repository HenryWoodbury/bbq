import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-helpers";
import { parsePositions } from "@/lib/positions";

export async function GET(request: NextRequest) {
  await auth.protect();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const position = searchParams.get("position");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search ? { playerName: { contains: search, mode: "insensitive" as const } } : {}),
    ...(position ? { positions: { has: position } } : {}),
  };

  const [players, total] = await Promise.all([
    prisma.player.findMany({ where, skip, take: limit, orderBy: { playerName: "asc" } }),
    prisma.player.count({ where }),
  ]);

  return NextResponse.json({ data: players, total, page, limit });
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { playerId, playerName, fangraphsId, fangraphsMinorsId, mlbamId, birthday, bioData } = body;

  if (!playerId || !playerName) {
    return NextResponse.json({ error: "playerId and playerName are required" }, { status: 400 });
  }

  const rawPositions: unknown = body.positions;
  const positions: string[] = Array.isArray(rawPositions)
    ? rawPositions
    : typeof rawPositions === "string"
      ? parsePositions(rawPositions)
      : [];

  const player = await prisma.player.create({
    data: {
      playerId,
      playerName,
      fangraphsId: fangraphsId ?? null,
      fangraphsMinorsId: fangraphsMinorsId ?? null,
      mlbamId: mlbamId ?? null,
      birthday: birthday ? new Date(birthday) : null,
      positions,
      bioData: bioData ?? {},
    },
  });

  return NextResponse.json(player, { status: 201 });
}
