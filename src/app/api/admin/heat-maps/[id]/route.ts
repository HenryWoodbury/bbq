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

  const { name, min, max, avg, increments, isPivot, minColor, avgColor, maxColor, minDarkColor, avgDarkColor, maxDarkColor } = parsed.data

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
