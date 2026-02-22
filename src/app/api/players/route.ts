import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  await auth.protect();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search
      ? { playerName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [players, total] = await Promise.all([
    prisma.player.findMany({ where, skip, take: limit, orderBy: { playerName: "asc" } }),
    prisma.player.count({ where }),
  ]);

  return NextResponse.json({ data: players, total, page, limit });
}

export async function POST(request: NextRequest) {
  await auth.protect();

  const body = await request.json();
  const { playerId, playerName, fangraphsId, fangraphsMinorsId, mlbamId, birthday, positions, bioData } = body;

  if (!playerId || !playerName) {
    return NextResponse.json({ error: "playerId and playerName are required" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      playerId,
      playerName,
      fangraphsId: fangraphsId ?? null,
      fangraphsMinorsId: fangraphsMinorsId ?? null,
      mlbamId: mlbamId ?? null,
      birthday: birthday ? new Date(birthday) : null,
      positions: positions ?? null,
      bioData: bioData ?? {},
    },
  });

  return NextResponse.json(player, { status: 201 });
}
