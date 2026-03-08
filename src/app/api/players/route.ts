import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { parsePositions } from "@/lib/positions"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  await auth.protect()

  const { searchParams } = request.nextUrl
  const search = searchParams.get("search")
  const position = searchParams.get("position")
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = parseInt(searchParams.get("limit") ?? "50", 10)
  const skip = (page - 1) * limit

  const where = {
    deletedAt: null,
    ...(search
      ? { playerName: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(position ? { positions: { has: position } } : {}),
  }

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      skip,
      take: limit,
      orderBy: { playerName: "asc" },
    }),
    prisma.player.count({ where }),
  ])

  return NextResponse.json({ data: players, total, page, limit })
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json()
  const {
    sfbbId,
    playerName,
    firstName,
    lastName,
    bats,
    throws: throwsHand,
    fangraphsId,
    mlbamId,
    birthday,
  } = body

  if (!sfbbId || !playerName) {
    return NextResponse.json(
      { error: "sfbbId and playerName are required" },
      { status: 400 },
    )
  }

  const rawPositions: unknown = body.positions
  const positions: string[] = Array.isArray(rawPositions)
    ? rawPositions
    : typeof rawPositions === "string"
      ? parsePositions(rawPositions)
      : []

  const player = await prisma.player.create({
    data: {
      sfbbId,
      playerName,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      bats: bats ?? null,
      throws: throwsHand ?? null,
      fangraphsId: fangraphsId ?? null,
      mlbamId: mlbamId ?? null,
      birthday: birthday ? new Date(birthday) : null,
      positions,
    },
  })

  return NextResponse.json(player, { status: 201 })
}
