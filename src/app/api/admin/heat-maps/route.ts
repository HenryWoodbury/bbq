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

const postSchema = z.object({
  name: z.string().min(1).max(24),
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

export async function POST(req: NextRequest) {
  await assertAdmin()

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, min, max, avg, increments, isPivot, curve, curveDark, minColor, avgColor, maxColor, minDarkColor, avgDarkColor, maxDarkColor } = parsed.data

  try {
    const heatMap = await prisma.heatMap.create({
      data: {
        name,
        min,
        max,
        avg,
        increments,
        isPivot,
        curve,
        curveDark,
        minColor: { create: minColor },
        avgColor: { create: avgColor },
        maxColor: { create: maxColor },
        minDarkColor: { create: minDarkColor },
        avgDarkColor: { create: avgDarkColor },
        maxDarkColor: { create: maxDarkColor },
      },
    })
    return NextResponse.json({ id: heatMap.id, name: heatMap.name }, { status: 201 })
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: `A heat map named "${name}" already exists` }, { status: 409 })
    }
    throw err
  }
}
