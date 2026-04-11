import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  scope: z.enum(["Players", "Teams", "Leagues", "Platform"]).optional(),
  type: z.enum(["Standard", "Splits", "Profiles"]).optional(),
  fields: z.array(z.string()).optional(),
})

const EXPORT_SELECT = {
  id: true,
  name: true,
  scope: true,
  type: true,
  fields: true,
} as const

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.dataExport.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { name, scope, type, fields } = parsed.data

  if (name !== undefined && name !== existing.name) {
    const nameConflict = await prisma.dataExport.findUnique({ where: { name } })
    if (nameConflict) {
      return NextResponse.json(
        { error: `An export named "${name}" already exists` },
        { status: 409 },
      )
    }
  }

  const updated = await prisma.dataExport.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(scope !== undefined && { scope }),
      ...(type !== undefined && { type }),
      ...(fields !== undefined && { fields }),
    },
    select: EXPORT_SELECT,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const denied = await assertAdmin()
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.dataExport.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.dataExport.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ deleted: true })
}
