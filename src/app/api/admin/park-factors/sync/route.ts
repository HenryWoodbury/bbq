import { type NextRequest, NextResponse } from "next/server"
import { assertAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

const SAVANT_BASE =
  "https://baseballsavant.mlb.com/leaderboard/statcast-park-factors"
const DATA_REGEX = /var\s+data\s+=\s+(\[[\s\S]*?\]);/

interface SavantRow {
  venue_id: number
  venue_name: string
  [key: string]: unknown
}

const VALID_BAT_SIDES = ["R", "L", ""] as const
const VALID_ROLLING = [1, 2, 3] as const
type BatSide = (typeof VALID_BAT_SIDES)[number]
type Rolling = (typeof VALID_ROLLING)[number]

type ParsedParams = { season: number; batSide: BatSide; rolling: Rolling }

function parseParams(body: {
  season?: unknown
  batSide?: unknown
  rolling?: unknown
}): ParsedParams | NextResponse {
  const season = Number(body.season)
  if (Number.isNaN(season) || season < 2000 || season > 2100) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 })
  }
  if (!(VALID_BAT_SIDES as readonly unknown[]).includes(body.batSide)) {
    return NextResponse.json({ error: "Invalid batSide" }, { status: 400 })
  }
  const rollingRaw = Number(body.rolling)
  if (!(VALID_ROLLING as readonly unknown[]).includes(rollingRaw)) {
    return NextResponse.json({ error: "Invalid rolling" }, { status: 400 })
  }
  return { season, batSide: body.batSide as BatSide, rolling: rollingRaw as Rolling }
}

export async function GET() {
  const denied = await assertAdmin()
  if (denied) return denied

  const syncs = await prisma.parkFactorSync.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(syncs)
}

export async function DELETE(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = (await request.json().catch(() => ({}))) as Parameters<typeof parseParams>[0]
  const params = parseParams(body)
  if (params instanceof NextResponse) return params
  const { season, batSide, rolling } = params

  await prisma.$transaction([
    prisma.parkFactor.deleteMany({ where: { season, batSide, rolling } }),
    prisma.parkFactorSync.deleteMany({ where: { season, batSide, rolling } }),
  ])

  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const denied = await assertAdmin()
  if (denied) return denied

  const body = (await request.json().catch(() => ({}))) as Parameters<typeof parseParams>[0]
  const params = parseParams(body)
  if (params instanceof NextResponse) return params
  const { season, batSide, rolling } = params

  const url = `${SAVANT_BASE}?type=year&year=${season}&batSide=${batSide}&rolling=${rolling}&parks=mlb`

  let html: string
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BBQ/1.0 (Fantasy Baseball Draft Manager)" },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Baseball Savant returned ${res.status}` },
        { status: 502 },
      )
    }
    html = await res.text()
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Baseball Savant" },
      { status: 502 },
    )
  }

  const match = html.match(DATA_REGEX)
  if (!match) {
    return NextResponse.json(
      {
        error:
          "Could not locate data in Baseball Savant response — page structure may have changed",
      },
      { status: 404 },
    )
  }

  let rows: SavantRow[]
  try {
    rows = JSON.parse(match[1]) as SavantRow[]
  } catch {
    return NextResponse.json(
      { error: "Failed to parse park factor data" },
      { status: 500 },
    )
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "No park factor data returned from Baseball Savant" },
      { status: 404 },
    )
  }

  try {
    const { upserted } = await prisma.$transaction(async (tx) => {
      let upserted = 0

      for (const row of rows) {
        const venueId = Number(row.venue_id)
        if (Number.isNaN(venueId) || typeof row.venue_name !== "string") continue

        const teamName =
          typeof row.name_display_club === "string"
            ? row.name_display_club
            : null

        const park = await tx.park.upsert({
          where: { venueId },
          create: { venueId, venueName: row.venue_name, teamName },
          update: { venueName: row.venue_name, teamName: teamName ?? undefined, deletedAt: null },
        })

        const factors: Record<string, number> = {}
        for (const [k, v] of Object.entries(row)) {
          if (k.startsWith("index_")) {
            const n = Number(v)
            if (!Number.isNaN(n)) factors[k] = n
          }
        }
        const pa = Number(row.n_pa)
        if (!Number.isNaN(pa)) factors["pa"] = pa

        await tx.parkFactor.upsert({
          where: {
            parkId_season_batSide_rolling: {
              parkId: park.id,
              season,
              batSide,
              rolling,
            },
          },
          create: {
            parkId: park.id,
            season,
            batSide,
            rolling,
            factors,
          },
          update: { factors, deletedAt: null },
        })
        upserted++
      }

      await tx.parkFactorSync.create({
        data: {
          season,
          batSide,
          rolling,
          total: rows.length,
          upserted,
        },
      })

      return { upserted }
    })

    return NextResponse.json({
      total: rows.length,
      upserted,
      season,
      batSide,
      rolling,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Park factor sync failed:", error)
    return NextResponse.json(
      { error: "Database error during sync" },
      { status: 500 },
    )
  }
}
