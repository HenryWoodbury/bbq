import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  await prisma.playerUniverseUpload.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
