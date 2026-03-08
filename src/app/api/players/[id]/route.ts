import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { parsePositions } from "@/lib/positions"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  await auth.protect()
  const { id } = await params

  const player = await prisma.player.findFirst({
    where: { id, deletedAt: null },
  })
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(player)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const denied = await assertAdmin()
  if (denied) return denied
  const { id } = await params

  const body = await request.json()
  const {
    playerName,
    firstName,
    lastName,
    bats,
    throws: throwsHand,
    fangraphsId,
    mlbamId,
    birthday,
    positions,
  } = body

  const player = await prisma.player.findFirst({
    where: { id, deletedAt: null },
  })
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.player.update({
    where: { id },
    data: {
      ...(playerName !== undefined && { playerName }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(bats !== undefined && { bats }),
      ...(throwsHand !== undefined && { throws: throwsHand }),
      ...(fangraphsId !== undefined && { fangraphsId }),
      ...(mlbamId !== undefined && { mlbamId }),
      ...(birthday !== undefined && {
        birthday: birthday ? new Date(birthday) : null,
      }),
      ...(positions !== undefined && {
        positions: Array.isArray(positions)
          ? positions
          : parsePositions(String(positions ?? "")),
      }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const denied = await assertAdmin()
  if (denied) return denied
  const { id } = await params

  const player = await prisma.player.findFirst({
    where: { id, deletedAt: null },
  })
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.player.update({ where: { id }, data: { deletedAt: new Date() } })

  return new NextResponse(null, { status: 204 })
}
