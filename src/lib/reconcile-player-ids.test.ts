import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { MANUAL_SFBB_PREFIX } from "@/lib/manual-players"

vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { reconcilePlayerIds } from "./reconcile-player-ids"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

type PlayerIdRow = {
  id: string
  fangraphsId: string | null
  mlbamId: number | null
  ottoneuId?: number | null
}

const SYNTHETIC: PlayerIdRow = {
  id: "synthetic-1",
  fangraphsId: "33225",
  mlbamId: 694378,
  ottoneuId: 43973,
}
const REAL: PlayerIdRow = {
  id: "real-1",
  fangraphsId: "33225",
  mlbamId: 694378,
  ottoneuId: 43973,
}

const STAT_KEY = {
  season: 2026,
  playerType: "BATTER",
  projection: "steamer",
  neutralized: false,
  split: "None",
  ros: false,
  deletedAt: null,
}

/** The prefix clauses are composed via AND (see `excludeManualPlayers`), so
 *  routing reads the conjuncts rather than the top-level where keys. */
function conjuncts(args: unknown): Record<string, unknown>[] {
  const where =
    (args as { where?: Record<string, unknown> } | undefined)?.where ?? {}
  return Array.isArray(where.AND) ? (where.AND as Record<string, unknown>[]) : []
}

/**
 * Routes the four distinct player.findMany calls reconcilePlayerIds makes by
 * inspecting the where clause, so tests stay readable and order-independent.
 */
function setup(opts: {
  synthetic?: PlayerIdRow[]
  real?: PlayerIdRow[]
  all?: PlayerIdRow[]
}) {
  const { synthetic = [], real = [], all = [] } = opts

  prismaMock.player.findMany.mockImplementation(((args: unknown) => {
    const where =
      (args as { where?: Record<string, unknown> } | undefined)?.where ?? {}
    const and = conjuncts(args)
    if (and.some((c) => "sfbbId" in c)) return Promise.resolve(synthetic)
    if (and.some((c) => "NOT" in c)) return Promise.resolve(real)
    if (where.ottoneuId === null) return Promise.resolve([])
    return Promise.resolve(all)
  }) as never)

  prismaMock.playerUniverse.findMany.mockResolvedValue([] as never)
  prismaMock.playerOverride.findMany.mockResolvedValue([] as never)
  prismaMock.playerStat.findMany.mockResolvedValue([] as never)
  prismaMock.playerOverride.findUnique.mockResolvedValue(null as never)

  // Interactive transactions run against the mock client; array-form batches
  // (used by the universe/ottoneuId writes) just resolve.
  prismaMock.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => Promise<unknown>)(prismaMock)
      : Promise.resolve([]),
  )
}

beforeEach(() => {
  mockReset(prismaMock)
})

describe("reconcilePlayerIds — synthetic player merge", () => {
  it("merges a synthetic player into the real SFBB player matched on FG id", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })

    const result = await reconcilePlayerIds()

    expect(result.manualPlayersMerged).toBe(1)
    expect(prismaMock.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "synthetic-1" },
        data: { deletedAt: expect.any(Date) },
      }),
    )
  })

  it("matches on MLBAM id when the FG id is absent", async () => {
    setup({
      synthetic: [{ id: "synthetic-1", fangraphsId: null, mlbamId: 694378 }],
      real: [{ id: "real-1", fangraphsId: "33225", mlbamId: 694378 }],
    })

    const result = await reconcilePlayerIds()
    expect(result.manualPlayersMerged).toBe(1)
  })

  it("repoints the synthetic player's stats onto the real player", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerStat.findMany
      .mockResolvedValueOnce([{ id: "stat-1", ...STAT_KEY }] as never)
      .mockResolvedValueOnce([] as never)

    await reconcilePlayerIds()

    expect(prismaMock.playerStat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["stat-1"] } },
      data: { playerId: "real-1" },
    })
    expect(prismaMock.playerStat.deleteMany).not.toHaveBeenCalled()
  })

  it("retires synthetic stats that would collide on the compound unique key", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerStat.findMany
      // synthetic holds one row the real player already has, plus one it doesn't
      .mockResolvedValueOnce([
        { id: "dupe", ...STAT_KEY },
        { id: "unique", ...STAT_KEY, split: "VsLeft" },
      ] as never)
      .mockResolvedValueOnce([{ id: "real-stat", ...STAT_KEY }] as never)

    await reconcilePlayerIds()

    expect(prismaMock.playerStat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["unique"] } },
      data: { playerId: "real-1" },
    })
    // The loser is soft-deleted, not destroyed — every other retirement path
    // in this codebase soft-deletes.
    expect(prismaMock.playerStat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["dupe"] } },
      data: { deletedAt: expect.any(Date) },
    })
    expect(prismaMock.playerStat.deleteMany).not.toHaveBeenCalled()
  })

  it("keeps a live synthetic stat when the real player's matching row is retired", async () => {
    // The compound unique excludes deletedAt, so a retired real row still holds
    // the key. Letting it win would destroy the uploaded projection in favour of
    // a row no view can see — the exact symptom the manual-player fix removes.
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerStat.findMany
      .mockResolvedValueOnce([{ id: "manual-stat", ...STAT_KEY }] as never)
      .mockResolvedValueOnce([
        { id: "retired-real-stat", ...STAT_KEY, deletedAt: new Date() },
      ] as never)

    await reconcilePlayerIds()

    // The retired row is cleared out to free the key…
    expect(prismaMock.playerStat.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["retired-real-stat"] } },
    })
    // …so the live one can take it.
    expect(prismaMock.playerStat.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["manual-stat"] } },
      data: { playerId: "real-1" },
    })
  })

  it("leaves an already-retired synthetic stat behind rather than swapping it in", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerStat.findMany
      .mockResolvedValueOnce([
        { id: "dead-manual-stat", ...STAT_KEY, deletedAt: new Date() },
      ] as never)
      .mockResolvedValueOnce([
        { id: "retired-real-stat", ...STAT_KEY, deletedAt: new Date() },
      ] as never)

    await reconcilePlayerIds()

    expect(prismaMock.playerStat.deleteMany).not.toHaveBeenCalled()
    expect(prismaMock.playerStat.updateMany).not.toHaveBeenCalled()
  })

  it("repoints universe and roster history rows", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })

    await reconcilePlayerIds()

    expect(prismaMock.playerUniverse.updateMany).toHaveBeenCalledWith({
      where: { playerId: "synthetic-1" },
      data: { playerId: "real-1" },
    })
    expect(prismaMock.rosterHistory.updateMany).toHaveBeenCalledWith({
      where: { playerId: "synthetic-1" },
      data: { playerId: "real-1" },
    })
  })

  it("repoints the manual override when the real player has none", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerOverride.findUnique
      .mockResolvedValueOnce({ id: "override-1" } as never) // synthetic's
      .mockResolvedValueOnce(null as never) // real has none

    await reconcilePlayerIds()

    expect(prismaMock.playerOverride.update).toHaveBeenCalledWith({
      where: { id: "override-1" },
      data: { playerId: "real-1" },
    })
    expect(prismaMock.playerOverride.delete).not.toHaveBeenCalled()
  })

  it("fills gaps in an existing override rather than dropping manual edits", async () => {
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerOverride.findUnique
      // the synthetic player's override — carries the admin's manual values
      .mockResolvedValueOnce({
        id: "manual-override",
        displayName: "Jacob Gonzalez",
        nickname: "Gonzo",
        positions: ["1B"],
      } as never)
      // the real player's existing override — mostly empty, but team is set
      .mockResolvedValueOnce({
        id: "real-override",
        deletedAt: null,
        displayName: null,
        firstName: null,
        lastName: null,
        nickname: null,
        birthday: null,
        team: "CWS",
        mlbLevel: null,
        league: null,
        active: null,
        bats: null,
        throws: null,
        positions: [],
        fangraphsId: null,
        mlbamId: null,
        ottoneuId: null,
      } as never)

    await reconcilePlayerIds()

    const arg = prismaMock.playerOverride.update.mock.calls.find(
      (c) => (c[0] as { where: { id: string } }).where.id === "real-override",
    )
    expect(arg).toBeDefined()
    const data = (arg as [{ data: Record<string, unknown> }])[0].data
    // null fields take the manual value; already-set fields are preserved
    expect(data.displayName).toBe("Jacob Gonzalez")
    expect(data.nickname).toBe("Gonzo")
    expect(data.team).toBe("CWS")
    expect(data.positions).toEqual(["1B"])
    expect(data.isManual).toBe(true)
    expect(prismaMock.playerOverride.delete).toHaveBeenCalledWith({
      where: { id: "manual-override" },
    })
  })

  it("does not let a retired override on the real player beat the manual data", async () => {
    // An admin cleared the real player's override, then added the same player
    // manually. Filling gaps from the dead override would resurrect stale values
    // and silently overwrite the manual edit.
    setup({ synthetic: [SYNTHETIC], real: [REAL] })
    prismaMock.playerOverride.findUnique
      .mockResolvedValueOnce({
        id: "manual-override",
        deletedAt: null,
        team: "NYY",
      } as never)
      .mockResolvedValueOnce({
        id: "dead-real-override",
        deletedAt: new Date(),
        team: "CWS",
      } as never)

    await reconcilePlayerIds()

    // The dead override is detached, not revived…
    expect(prismaMock.playerOverride.update).toHaveBeenCalledWith({
      where: { id: "dead-real-override" },
      data: { playerId: null },
    })
    // …and the manual override takes the slot with its own values intact.
    expect(prismaMock.playerOverride.update).toHaveBeenCalledWith({
      where: { id: "manual-override" },
      data: { playerId: "real-1" },
    })
    const revived = prismaMock.playerOverride.update.mock.calls.find(
      (c) => (c[0] as { data: Record<string, unknown> }).data.deletedAt === null,
    )
    expect(revived).toBeUndefined()
    expect(prismaMock.playerOverride.delete).not.toHaveBeenCalled()
  })
})

describe("reconcilePlayerIds — merge guards", () => {
  it("does nothing when no synthetic players exist", async () => {
    setup({ synthetic: [], real: [REAL] })

    const result = await reconcilePlayerIds()

    expect(result.manualPlayersMerged).toBe(0)
    expect(prismaMock.player.update).not.toHaveBeenCalled()
  })

  it("leaves a synthetic player alone when no real player matches", async () => {
    setup({ synthetic: [SYNTHETIC], real: [] })

    const result = await reconcilePlayerIds()

    expect(result.manualPlayersMerged).toBe(0)
    expect(prismaMock.player.update).not.toHaveBeenCalled()
    expect(prismaMock.playerStat.updateMany).not.toHaveBeenCalled()
  })

  it("skips the match query when the synthetic player has no cross-reference ids", async () => {
    // An empty OR clause would match every player and merge into an arbitrary one
    setup({
      synthetic: [{ id: "synthetic-1", fangraphsId: null, mlbamId: null }],
      real: [REAL],
    })

    const result = await reconcilePlayerIds()

    expect(result.manualPlayersMerged).toBe(0)
    const matchQueries = prismaMock.player.findMany.mock.calls.filter((c) =>
      conjuncts(c[0]).some((clause) => "NOT" in clause),
    )
    expect(matchQueries).toHaveLength(0)
  })

  it("queries synthetic players by the manual sfbbId prefix", async () => {
    setup({ synthetic: [], real: [] })

    await reconcilePlayerIds()

    expect(prismaMock.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { deletedAt: null },
            { sfbbId: { startsWith: MANUAL_SFBB_PREFIX } },
          ],
        },
      }),
    )
  })

  it("composes the prefix test with AND so a caller's own clause survives", async () => {
    // Spreading a `NOT` fragment into a where that already has one silently
    // drops a side; the sweep's `sfbbId: { notIn }` is exactly that collision.
    setup({ synthetic: [SYNTHETIC], real: [REAL] })

    await reconcilePlayerIds()

    const matchQuery = prismaMock.player.findMany.mock.calls.find((c) =>
      conjuncts(c[0]).some((clause) => "NOT" in clause),
    )
    expect(matchQuery).toBeDefined()
    const and = conjuncts(matchQuery?.[0])
    expect(and).toHaveLength(2)
    // The caller's own OR/deletedAt clause is untouched by the prefix test.
    expect(and[0]).toMatchObject({ deletedAt: null })
    expect(and[0]).toHaveProperty("OR")
    expect(and[1]).toEqual({
      NOT: { sfbbId: { startsWith: MANUAL_SFBB_PREFIX } },
    })
  })
})
