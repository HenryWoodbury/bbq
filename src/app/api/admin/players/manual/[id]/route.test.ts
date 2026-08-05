import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { newManualSfbbId } from "@/lib/manual-players"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { DELETE, PATCH } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const SYNTHETIC_SFBB_ID = newManualSfbbId()

/** The stored override a PATCH merges onto, as the route selects it. */
const EXISTING = {
  id: "override-1",
  isManual: true,
  deletedAt: null,
  displayName: "Jacob Gonzalez",
  firstName: "Jacob",
  lastName: "Gonzalez",
  birthday: new Date("2000-03-15T00:00:00Z"),
  team: "PIT",
  mlbLevel: "MLB",
  active: true,
  bats: "L",
  throws: "R",
  positions: ["1B", "SS"],
  player: { id: "player-1", sfbbId: SYNTHETIC_SFBB_ID },
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/players/manual/o1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function deleteRequest() {
  return new NextRequest("http://localhost/api/admin/players/manual/o1", {
    method: "DELETE",
  })
}

/** Run interactive transactions against the mock client itself. */
function inlineTransactions() {
  prismaMock.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: unknown) => Promise<unknown>)(prismaMock)
      : Promise.resolve([]),
  )
}

/** The `data` of the single player.update call, or undefined if none happened. */
function playerUpdateData(): Record<string, unknown> | undefined {
  const call = prismaMock.player.update.mock.calls[0]
  return call ? (call[0] as { data: Record<string, unknown> }).data : undefined
}

beforeEach(() => {
  mockReset(prismaMock)
  mockAuth.mockReset()
  mockAuth.mockResolvedValue({
    userId: "user_1",
    sessionClaims: { metadata: { role: "admin" } },
  })
  inlineTransactions()
  prismaMock.playerOverride.findUnique.mockResolvedValue(EXISTING as never)
  prismaMock.playerOverride.update.mockResolvedValue({
    id: "override-1",
    updatedAt: new Date("2026-08-05T00:00:00Z"),
  } as never)
  prismaMock.player.update.mockResolvedValue({ id: "player-1" } as never)
  prismaMock.playerStat.updateMany.mockResolvedValue({ count: 3 } as never)
})

describe("PATCH /api/admin/players/manual/[id] — auth", () => {
  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    const res = await PATCH(patchRequest({ team: "NYY" }), params("override-1"))
    expect(res.status).toBe(401)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })

  it("403s for non-admins", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "member" } },
    })
    const res = await PATCH(patchRequest({ team: "NYY" }), params("override-1"))
    expect(res.status).toBe(403)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })
})

describe("PATCH /api/admin/players/manual/[id] — lookup", () => {
  it("404s when the override does not exist", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue(null as never)
    const res = await PATCH(patchRequest({ team: "NYY" }), params("nope"))
    expect(res.status).toBe(404)
  })

  it("404s when the override is not a manual add", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      isManual: false,
    } as never)
    const res = await PATCH(patchRequest({ team: "NYY" }), params("override-1"))
    expect(res.status).toBe(404)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })

  it("404s when the override is soft-deleted", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      deletedAt: new Date(),
    } as never)
    const res = await PATCH(patchRequest({ team: "NYY" }), params("override-1"))
    expect(res.status).toBe(404)
  })

  it("400s on a malformed body", async () => {
    const res = await PATCH(patchRequest({ active: "yes" }), params("o1"))
    expect(res.status).toBe(400)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })
})

describe("PATCH /api/admin/players/manual/[id] — patch semantics", () => {
  it("leaves omitted fields alone and clears the ones sent as null", async () => {
    await PATCH(patchRequest({ nickname: null }), params("override-1"))

    const data = prismaMock.playerOverride.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>
    }
    expect(data.data.nickname).toBeNull()
    // `undefined` is Prisma's "leave alone", so an omitted field must stay so.
    expect(data.data.team).toBeUndefined()
    expect(data.data.displayName).toBeUndefined()
  })

  it("normalizes an incoming team code", async () => {
    await PATCH(patchRequest({ team: "WSN" }), params("override-1"))

    const data = prismaMock.playerOverride.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>
    }
    expect(data.data.team).toBe("WAS")
    expect(playerUpdateData()?.team).toBe("WAS")
  })

  it("parses a birthday string into a Date", async () => {
    await PATCH(patchRequest({ birthday: "2000-03-15" }), params("override-1"))

    const data = prismaMock.playerOverride.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>
    }
    expect(data.data.birthday).toBeInstanceOf(Date)
  })
})

describe("PATCH /api/admin/players/manual/[id] — synthetic Player sync", () => {
  it("mirrors the edit onto the synthetic Player row", async () => {
    // The export reads Player.fgSpecialChar/team/active, so an override-only
    // write would leave the exported row stale.
    await PATCH(
      patchRequest({ team: "NYY", displayName: "Jake Gonzalez" }),
      params("override-1"),
    )

    expect(playerUpdateData()).toMatchObject({
      team: "NYY",
      fgSpecialChar: "Jake Gonzalez",
      playerName: "Jake Gonzalez",
    })
  })

  it("carries stored values through for fields the patch omits", async () => {
    await PATCH(patchRequest({ team: "NYY" }), params("override-1"))

    // Player.* is not patch-shaped — every column is written, so omitted fields
    // must be filled from the stored override or they would be nulled out.
    expect(playerUpdateData()).toMatchObject({
      firstName: "Jacob",
      lastName: "Gonzalez",
      bats: "L",
      throws: "R",
      positions: ["1B", "SS"],
    })
  })

  it("derives playerName from the name parts when displayName is cleared", async () => {
    await PATCH(patchRequest({ displayName: null }), params("override-1"))

    expect(playerUpdateData()).toMatchObject({
      playerName: "Jacob Gonzalez",
      fgSpecialChar: null,
    })
  })

  it("leaves Player.active alone when the override clears active", async () => {
    // Player.active is non-nullable; `active: null` means "no opinion", which
    // for a synthetic player can only mean keeping what is already there.
    await PATCH(patchRequest({ active: null }), params("override-1"))

    expect(playerUpdateData()).not.toHaveProperty("active")
  })

  it("writes active through when the override sets it", async () => {
    await PATCH(patchRequest({ active: false }), params("override-1"))

    expect(playerUpdateData()?.active).toBe(false)
  })

  it("does not touch a real SFBB Player the manual add was merged into", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      player: { id: "player-1", sfbbId: "15640" },
    } as never)

    await PATCH(patchRequest({ team: "NYY" }), params("override-1"))

    expect(prismaMock.playerOverride.update).toHaveBeenCalled()
    expect(prismaMock.player.update).not.toHaveBeenCalled()
  })

  it("tolerates an override with no Player row", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      player: null,
    } as never)

    const res = await PATCH(patchRequest({ team: "NYY" }), params("override-1"))

    expect(res.status).toBe(200)
    expect(prismaMock.player.update).not.toHaveBeenCalled()
  })
})

describe("DELETE /api/admin/players/manual/[id]", () => {
  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    const res = await DELETE(deleteRequest(), params("override-1"))
    expect(res.status).toBe(401)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })

  it("403s for non-admins", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "member" } },
    })
    const res = await DELETE(deleteRequest(), params("override-1"))
    expect(res.status).toBe(403)
  })

  it("404s when the override is not a manual add", async () => {
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      isManual: false,
    } as never)
    const res = await DELETE(deleteRequest(), params("override-1"))
    expect(res.status).toBe(404)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
  })

  it("404s when the manual player is already retired, as PATCH does", async () => {
    // Without the guard a second DELETE moves the retirement timestamp and
    // re-retires stats that were already retired.
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      deletedAt: new Date("2026-01-01T00:00:00Z"),
    } as never)

    const res = await DELETE(deleteRequest(), params("override-1"))

    expect(res.status).toBe(404)
    expect(prismaMock.playerOverride.update).not.toHaveBeenCalled()
    expect(prismaMock.player.update).not.toHaveBeenCalled()
    expect(prismaMock.playerStat.updateMany).not.toHaveBeenCalled()
  })

  it("soft-deletes the override, the synthetic Player and its stats", async () => {
    const res = await DELETE(deleteRequest(), params("override-1"))

    expect(res.status).toBe(200)
    expect(prismaMock.playerOverride.update).toHaveBeenCalledWith({
      where: { id: "override-1" },
      data: { deletedAt: expect.any(Date) },
    })
    expect(prismaMock.player.update).toHaveBeenCalledWith({
      where: { id: "player-1" },
      data: { deletedAt: expect.any(Date) },
    })
    // Stat rows outlive their player, so the export would keep emitting them.
    expect(prismaMock.playerStat.updateMany).toHaveBeenCalledWith({
      where: { playerId: "player-1", deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it("stamps one timestamp across all three writes", async () => {
    await DELETE(deleteRequest(), params("override-1"))

    const overrideAt = (
      prismaMock.playerOverride.update.mock.calls[0]?.[0] as {
        data: { deletedAt: Date }
      }
    ).data.deletedAt
    const playerAt = (
      prismaMock.player.update.mock.calls[0]?.[0] as {
        data: { deletedAt: Date }
      }
    ).data.deletedAt
    expect(playerAt.getTime()).toBe(overrideAt.getTime())
  })

  it("spares a real SFBB Player the manual add was merged into", async () => {
    // Only the manual record is being removed — the canonical player survives.
    prismaMock.playerOverride.findUnique.mockResolvedValue({
      ...EXISTING,
      player: { id: "player-1", sfbbId: "15640" },
    } as never)

    await DELETE(deleteRequest(), params("override-1"))

    expect(prismaMock.playerOverride.update).toHaveBeenCalled()
    expect(prismaMock.player.update).not.toHaveBeenCalled()
    expect(prismaMock.playerStat.updateMany).not.toHaveBeenCalled()
  })
})
