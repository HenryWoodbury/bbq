import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const upload = await prisma.statUpload.findUnique({ where: { id } })
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.playerStat.updateMany({
      where: {
        season: upload.season,
        playerType: upload.playerType,
        projection: upload.projection,
        split: upload.split,
        deletedAt: null,
      },
      data: { deletedAt: now },
    }),
    prisma.statUpload.delete({ where: { id } }),
  ])

  return new NextResponse(null, { status: 204 })
}
