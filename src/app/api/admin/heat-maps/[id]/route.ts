import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const oklchColorSchema = z.object({
  lightness: z.number(),
  chroma: z.number(),
  hue: z.number(),
  alpha: z.number(),
})

const patchSchema = z.object({
  name: z.string().min(1),
  min: z.number(),
  max: z.number(),
  avg: z.number(),
  increments: z.number(),
  isPivot: z.boolean(),
  curve: z.number().min(0.1).max(10),
  curveDark: z.number().min(0.1).max(10),
  minColor: oklchColorSchema,
  avgColor: oklchColorSchema,
  maxColor: oklchColorSchema,
  minDarkColor: oklchColorSchema,
  avgDarkColor: oklchColorSchema,
  maxDarkColor: oklchColorSchema,
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  await assertAdmin()

  const { id: idStr } = await params
  const id = Number(idStr)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, min, max, avg, increments, isPivot, curve, curveDark, minColor, avgColor, maxColor, minDarkColor, avgDarkColor, maxDarkColor } = parsed.data

  try {
    await prisma.heatMap.update({
      where: { id },
      data: {
        name,
        min,
        max,
        avg,
        increments,
        isPivot,
        curve,
        curveDark,
        minColor: { update: minColor },
        avgColor: { update: avgColor },
        maxColor: { update: maxColor },
        minDarkColor: { update: minDarkColor },
        avgDarkColor: { update: avgDarkColor },
        maxDarkColor: { update: maxDarkColor },
      },
    })
  } catch {
    return NextResponse.json({ error: "Heat map not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  await assertAdmin()

  const { id: idStr } = await params
  const id = Number(idStr)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const heatMap = await prisma.heatMap.findUnique({ where: { id } })
  if (!heatMap) {
    return NextResponse.json({ error: "Heat map not found" }, { status: 404 })
  }
  if (heatMap.name === "Default") {
    return NextResponse.json(
      { error: "The Default heat map cannot be deleted" },
      { status: 400 },
    )
  }

  const colorIds = [
    heatMap.minColorId,
    heatMap.avgColorId,
    heatMap.maxColorId,
    heatMap.minDarkColorId,
    heatMap.avgDarkColorId,
    heatMap.maxDarkColorId,
  ]

  await prisma.$transaction([
    prisma.heatMap.delete({ where: { id } }),
    prisma.oklchColor.deleteMany({ where: { id: { in: colorIds } } }),
  ])

  return NextResponse.json({ success: true })
}
