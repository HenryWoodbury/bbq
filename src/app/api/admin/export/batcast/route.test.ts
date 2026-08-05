import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { StatSplit } from "@/generated/prisma/client"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { GET } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const PLAYER = {
  id: "player-1",
  ottoneuId: 43973,
  fangraphsId: "33225",
  playerName: "Jacob Gonzalez",
  fgSpecialChar: null,
  team: "PIT", // NL
  mlbLevel: "MLB",
  active: true,
  birthday: new Date("2000-03-15T00:00:00Z"),
  bats: "L",
  throws: "R",
  override: null,
  universe: [{ positions: ["1B", "2B", "SS"] }],
}

const NO_OVERRIDE = {
  deletedAt: null,
  displayName: null,
  team: null,
  mlbLevel: null,
  league: null,
  active: null,
  birthday: null,
  bats: null,
  throws: null,
}

/** One player with the given override, and a primary stat row for them. */
function setupPlayerWithOverride(override: Record<string, unknown> | null) {
  prismaMock.player.findMany.mockResolvedValue([
    { ...PLAYER, override },
  ] as never)
  setupStats({
    primary: [
      { playerId: "player-1", stats: { wOBA: 0.321 }, split: StatSplit.Neutral },
    ],
  })
}

/** Names in the CSV body, header excluded. */
async function exportedNames(params: Record<string, string>) {
  const res = await GET(makeRequest(params))
  const [header, ...rows] = await csvRows(res)
  return rows.filter((r) => r[0] !== "").map((r) => r[header.indexOf("Name")])
}

type StatRow = { playerId: string; stats: unknown; split?: StatSplit }

/** Routes the three playerStat.findMany calls by the split they ask for. */
function setupStats(opts: {
  primary?: StatRow[]
  vsLeft?: StatRow[]
  vsRight?: StatRow[]
}) {
  const { primary = [], vsLeft = [], vsRight = [] } = opts
  prismaMock.playerStat.findMany.mockImplementation(((args: unknown) => {
    const split = (
      args as { where: { split: StatSplit | { in: StatSplit[] } } }
    ).where.split
    if (typeof split === "object" && "in" in split) return Promise.resolve(primary)
    if (split === StatSplit.VsLeft) return Promise.resolve(vsLeft)
    if (split === StatSplit.VsRight) return Promise.resolve(vsRight)
    return Promise.resolve([])
  }) as never)
}

function makeRequest(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  return new Request(`http://localhost/api/admin/export/batcast?${qs}`)
}

/** Header row plus one data row, split into fields. */
async function csvRows(res: Response): Promise<string[][]> {
  const text = await res.text()
  return text.split("\n").map((l) => l.split(","))
}

beforeEach(() => {
  mockReset(prismaMock)
  mockAuth.mockReset()
  mockAuth.mockResolvedValue({
    userId: "user_1",
    sessionClaims: { metadata: { role: "admin" } },
  })
  prismaMock.player.findMany.mockResolvedValue([PLAYER] as never)
})

describe("GET /api/admin/export/batcast — auth", () => {
  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    const res = await GET(
      makeRequest({ season: "2026", playerType: "BATTER" }),
    )
    expect(res.status).toBe(401)
  })

  it("403s for non-admins", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "member" } },
    })
    const res = await GET(
      makeRequest({ season: "2026", playerType: "BATTER" }),
    )
    expect(res.status).toBe(403)
  })
})

describe("GET /api/admin/export/batcast — params", () => {
  it("400s on a missing playerType", async () => {
    const res = await GET(makeRequest({ season: "2026" }))
    expect(res.status).toBe(400)
  })

  it("400s on an unknown projection", async () => {
    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Nonsense",
      }),
    )
    expect(res.status).toBe(400)
  })

  it("400s on a season before 2000", async () => {
    const res = await GET(
      makeRequest({ season: "1999", playerType: "BATTER" }),
    )
    expect(res.status).toBe(400)
  })

  it("400s on an unknown active filter rather than silently exporting all", async () => {
    const res = await GET(
      makeRequest({ season: "2026", playerType: "BATTER", active: "maybe" }),
    )
    expect(res.status).toBe(400)
  })

  it("400s on an unknown league filter", async () => {
    const res = await GET(
      makeRequest({ season: "2026", playerType: "BATTER", league: "pacific" }),
    )
    expect(res.status).toBe(400)
  })
})

describe("GET /api/admin/export/batcast — filters respect overrides", () => {
  const BASE = {
    season: "2026",
    playerType: "BATTER",
    projection: "Steamer",
  }

  it("keeps a player the override activates", async () => {
    // Player.active is false, but a live override says active — the export
    // previously filtered on the raw column and dropped them.
    prismaMock.player.findMany.mockResolvedValue([
      { ...PLAYER, active: false, override: { ...NO_OVERRIDE, active: true } },
    ] as never)
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    expect(await exportedNames({ ...BASE, active: "yes" })).toEqual([
      "Jacob Gonzalez",
    ])
  })

  it("drops a player the override deactivates", async () => {
    prismaMock.player.findMany.mockResolvedValue([
      { ...PLAYER, active: true, override: { ...NO_OVERRIDE, active: false } },
    ] as never)
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    expect(await exportedNames({ ...BASE, active: "yes" })).toEqual([])
  })

  it("ignores a soft-deleted override when filtering", async () => {
    setupPlayerWithOverride({
      ...NO_OVERRIDE,
      active: false,
      deletedAt: new Date(),
    })

    // Player.active is true and the override is retired, so it still matches
    expect(await exportedNames({ ...BASE, active: "yes" })).toEqual([
      "Jacob Gonzalez",
    ])
  })

  it("honours an overridden team for the AL/NL split", async () => {
    // Canonical team PIT is NL; the override moves them to AL
    setupPlayerWithOverride({ ...NO_OVERRIDE, team: "NYY" })

    expect(await exportedNames({ ...BASE, league: "al" })).toEqual([
      "Jacob Gonzalez",
    ])
    expect(await exportedNames({ ...BASE, league: "nl" })).toEqual([])
  })

  it("honours an explicit league override", async () => {
    setupPlayerWithOverride({ ...NO_OVERRIDE, league: "AL" })

    expect(await exportedNames({ ...BASE, league: "al" })).toEqual([
      "Jacob Gonzalez",
    ])
  })

  it("falls back to the canonical team when the override sets no team", async () => {
    setupPlayerWithOverride({ ...NO_OVERRIDE, displayName: "Jake G." })

    expect(await exportedNames({ ...BASE, league: "nl" })).toEqual(["Jake G."])
    expect(await exportedNames({ ...BASE, league: "al" })).toEqual([])
  })

  it("splits MLB/MiLB on the Fangraphs id, which is not overridable", async () => {
    prismaMock.player.findMany.mockResolvedValue([
      { ...PLAYER, fangraphsId: "sa3022054", override: null },
    ] as never)
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    expect(await exportedNames({ ...BASE, league: "milb" })).toEqual([
      "Jacob Gonzalez",
    ])
    expect(await exportedNames({ ...BASE, league: "mlb" })).toEqual([])
  })
})

describe("GET /api/admin/export/batcast — primary split handling", () => {
  it("reads a batter's primary line stored as Neutral", async () => {
    // Regression: the batter query previously asked for split=None only, so a
    // Neutral-sourced upload produced an empty wOBA column for every row.
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)

    expect(header).toContain("wOBA")
    expect(row[header.indexOf("wOBA")]).toBe("0.321")
  })

  it("reads a batter's primary line stored as None", async () => {
    setupStats({
      primary: [
        { playerId: "player-1", stats: { wOBA: 0.298 }, split: StatSplit.None },
      ],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)
    expect(row[header.indexOf("wOBA")]).toBe("0.298")
  })

  it("prefers Neutral when a player has both None and Neutral rows", async () => {
    setupStats({
      primary: [
        { playerId: "player-1", stats: { wOBA: 0.1 }, split: StatSplit.None },
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)
    expect(row[header.indexOf("wOBA")]).toBe("0.321")
  })

  it("queries both None and Neutral for pitchers too", async () => {
    setupStats({
      primary: [
        { playerId: "player-1", stats: { FIP: 3.85 }, split: StatSplit.Neutral },
      ],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "PITCHER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)

    expect(header).toContain("FIP")
    expect(row[header.indexOf("FIP")]).toBe("3.85")
  })
})

describe("GET /api/admin/export/batcast — row content", () => {
  it("emits ids, name, positions and both splits", async () => {
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
      vsLeft: [{ playerId: "player-1", stats: { wOBA: 0.345 } }],
      vsRight: [{ playerId: "player-1", stats: { wOBA: 0.31 } }],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)
    const at = (col: string) => row[header.indexOf(col)]

    expect(at("Ottoneu ID")).toBe("43973")
    expect(at("Fangraphs ID")).toBe("33225")
    expect(at("Name")).toBe("Jacob Gonzalez")
    expect(at("Birthday")).toBe("2000-03-15")
    expect(at("Positions")).toBe("1B/2B/SS")
    expect(at("wOBA vs LHP")).toBe("0.345")
    expect(at("wOBA vs RHP")).toBe("0.31")
  })

  it("includes a player that only has split rows", async () => {
    // allPlayerIds is the union of all three queries, so a player missing the
    // primary line still appears — with an empty wOBA.
    setupStats({ vsLeft: [{ playerId: "player-1", stats: { wOBA: 0.345 } }] })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const [header, row] = await csvRows(res)
    expect(row[header.indexOf("Name")]).toBe("Jacob Gonzalez")
    expect(row[header.indexOf("wOBA")]).toBe("")
  })

  it("returns a header-only CSV when nothing matches", async () => {
    setupStats({})
    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
      }),
    )
    const text = await res.text()
    expect(text.split("\n")).toHaveLength(1)
    expect(prismaMock.player.findMany).not.toHaveBeenCalled()
  })

  it("uses the same columns whether or not there are rows", async () => {
    // The empty CSV used to omit the three stat columns
    const params = {
      season: "2026",
      playerType: "BATTER",
      projection: "Steamer",
    }

    setupStats({})
    const [emptyHeader] = await csvRows(await GET(makeRequest(params)))

    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })
    const [populatedHeader] = await csvRows(await GET(makeRequest(params)))

    expect(emptyHeader).toEqual(populatedHeader)
    expect(emptyHeader).toContain("wOBA")
  })

  it("uses pitcher column names for pitcher exports", async () => {
    setupStats({})
    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "PITCHER",
        projection: "Steamer",
      }),
    )
    const [header] = await csvRows(res)
    expect(header).toContain("FIP")
    expect(header).toContain("wOBA vs LHB")
  })

  it("serves JSON when format=json", async () => {
    setupStats({
      primary: [
        {
          playerId: "player-1",
          stats: { wOBA: 0.321 },
          split: StatSplit.Neutral,
        },
      ],
    })

    const res = await GET(
      makeRequest({
        season: "2026",
        playerType: "BATTER",
        projection: "Steamer",
        format: "json",
      }),
    )
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].wOBA).toBe(0.321)
    expect(body[0].ottoneuId).toBe(43973)
  })
})
