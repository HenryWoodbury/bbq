import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { MANUAL_SFBB_PREFIX } from "@/lib/manual-players"

const { mockAuth, mockReconcile } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockReconcile: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma")
vi.mock("@/lib/reconcile-player-ids", () => ({
  reconcilePlayerIds: mockReconcile,
}))

import { prisma } from "@/lib/prisma"
import { POST } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const RECONCILED = {
  linked: 1,
  ottoneuIdsFilled: 0,
  manualOverridesLinked: 0,
  manualPlayersMerged: 0,
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/players/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

beforeEach(() => {
  mockReset(prismaMock)
  mockAuth.mockReset()
  mockReconcile.mockReset()
  mockAuth.mockResolvedValue({
    userId: "user_1",
    sessionClaims: { metadata: { role: "admin" } },
  })
  mockReconcile.mockResolvedValue(RECONCILED)
  inlineTransactions()
  prismaMock.player.create.mockResolvedValue({
    id: "player-1",
  } as never)
  prismaMock.playerOverride.create.mockResolvedValue({
    id: "override-1",
    isManual: true,
    createdAt: new Date("2026-08-05T00:00:00Z"),
  } as never)
})

describe("POST /api/admin/players/manual — auth", () => {
  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    const res = await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    expect(res.status).toBe(401)
    expect(prismaMock.player.create).not.toHaveBeenCalled()
  })

  it("403s for non-admins", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_1",
      sessionClaims: { metadata: { role: "member" } },
    })
    const res = await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    expect(res.status).toBe(403)
    expect(prismaMock.player.create).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/players/manual — validation", () => {
  it("400s when no name field is supplied", async () => {
    const res = await POST(makeRequest({ fangraphsId: "33225" }))
    expect(res.status).toBe(400)
    expect(prismaMock.player.create).not.toHaveBeenCalled()
  })

  it("400s on a malformed body", async () => {
    const res = await POST(makeRequest({ mlbamId: "not-a-number" }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/admin/players/manual — Player row", () => {
  it("mints a canonical Player so stats can link to it", async () => {
    const res = await POST(
      makeRequest({
        displayName: "Jacob Gonzalez",
        fangraphsId: "33225",
        mlbamId: 694378,
        ottoneuId: 43973,
        positions: ["1B", "2B", "SS"],
        team: "CWS",
        bats: "L",
        throws: "R",
        birthday: "2000-03-15",
      }),
    )

    expect(res.status).toBe(201)
    expect(prismaMock.player.create).toHaveBeenCalledTimes(1)

    const arg = prismaMock.player.create.mock.calls[0][0]
    expect(arg.data.sfbbId).toMatch(new RegExp(`^${MANUAL_SFBB_PREFIX}`))
    expect(arg.data.playerName).toBe("Jacob Gonzalez")
    // The identity ids must land on Player: stat upload resolves rows against
    // Player.fangraphsId / Player.mlbamId, and Batcast reads Player.ottoneuId.
    expect(arg.data.fangraphsId).toBe("33225")
    expect(arg.data.mlbamId).toBe(694378)
    expect(arg.data.ottoneuId).toBe(43973)
    expect(arg.data.positions).toEqual(["1B", "2B", "SS"])
    expect(arg.data.bats).toBe("L")
    expect(arg.data.throws).toBe("R")
  })

  it("derives playerName from first + last when displayName is absent", async () => {
    await POST(makeRequest({ firstName: "Jacob", lastName: "Gonzalez" }))
    expect(prismaMock.player.create.mock.calls[0][0].data.playerName).toBe(
      "Jacob Gonzalez",
    )
  })

  it("defaults Player.active to true so it survives the active filter", async () => {
    await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    expect(prismaMock.player.create.mock.calls[0][0].data.active).toBe(true)
  })

  it("honours an explicit active: false", async () => {
    await POST(makeRequest({ displayName: "Jacob Gonzalez", active: false }))
    expect(prismaMock.player.create.mock.calls[0][0].data.active).toBe(false)
  })

  it("normalizes the team code so the AL/NL export filters match", async () => {
    // WSN is the Fangraphs/Ottoneu spelling; NL_TEAM_CODES holds WAS
    await POST(makeRequest({ displayName: "Jacob Gonzalez", team: " WSN " }))
    expect(prismaMock.player.create.mock.calls[0][0].data.team).toBe("WAS")
  })
})

describe("POST /api/admin/players/manual — override link", () => {
  it("links the override to the new Player", async () => {
    await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    const arg = prismaMock.playerOverride.create.mock.calls[0][0]
    expect(arg.data.playerId).toBe("player-1")
    expect(arg.data.isManual).toBe(true)
  })

  it("creates both rows inside one transaction", async () => {
    await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it("returns the override id, player id and reconcile counts", async () => {
    const res = await POST(makeRequest({ displayName: "Jacob Gonzalez" }))
    const body = await res.json()
    expect(body.id).toBe("override-1")
    expect(body.playerId).toBe("player-1")
    expect(body.reconciled).toEqual(RECONCILED)
  })
})

describe("POST /api/admin/players/manual — reconcile", () => {
  it("reconciles so the matching universe row attaches (positions come from universe)", async () => {
    await POST(makeRequest({ displayName: "Jacob Gonzalez", ottoneuId: 43973 }))
    expect(mockReconcile).toHaveBeenCalledTimes(1)
  })
})
