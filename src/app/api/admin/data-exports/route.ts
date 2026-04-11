import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const exportSchema = z.object({
  name: z.string().min(1),
  scope: z.enum(["Players", "Teams", "Leagues", "Platform"]),
  type: z.enum(["Standard", "Splits", "Profiles"]),
  fields: z.array(z.string()),
})

const EXPORT_SELECT = {
  id: true,
  name: true,
  scope: true,
  type: true,
  fields: true,
} as const

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const exports = await prisma.dataExport.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: EXPORT_SELECT,
  })

  return NextResponse.json(exports)
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = exportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, scope, type, fields } = parsed.data

  const existing = await prisma.dataExport.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json(
      { error: `An export named "${name}" already exists` },
      { status: 409 },
    )
  }

  const created = await prisma.dataExport.create({
    data: { name, scope, type, fields },
    select: EXPORT_SELECT,
  })

  return NextResponse.json(created, { status: 201 })
}
