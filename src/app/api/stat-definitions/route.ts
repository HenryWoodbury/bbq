import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await auth.protect()

  const stats = await prisma.statDefinition.findMany({
    where: { deletedAt: null },
    orderBy: { abbreviation: "asc" },
  })

  return NextResponse.json({ data: stats, total: stats.length })
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json()
  const { abbreviation, playerType, name, description, format } = body

  if (!abbreviation || !playerType) {
    return NextResponse.json(
      { error: "abbreviation and playerType are required" },
      { status: 400 },
    )
  }

  const stat = await prisma.statDefinition.create({
    data: { abbreviation, playerType, name, description, format },
  })

  return NextResponse.json(stat, { status: 201 })
}
