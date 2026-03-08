import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type {
  Player,
  PlayerUniverse,
  PrismaClient,
} from "@/generated/prisma/client"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { POST } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

// Minimal valid Ottoneu Player Universe CSV
const HDR =
  '"Ottoneu ID",Name,"FG ID","FG Minor ID","MLBAM ID",Birthday,"Ottoneu Positions"'
const VALID_CSV = [
  HDR,
  "1001,Aaron Judge,15640,,592450,1992-04-26,OF",
  "1002,Shohei Ohtani,19755,,660271,1994-07-05,SP/RP",
].join("\n")

function makeRequest(csv: string, mode = "replace") {
  const formData = new FormData()
  formData.append("file", new File([csv], "universe.csv", { type: "text/csv" }))
  formData.append("mode", mode)
  return new NextRequest("http://localhost/api/admin/upload-universe", {
    method: "POST",
    body: formData,
  })
}

function setupHappyPath() {
  prismaMock.player.findMany.mockResolvedValue([])
  prismaMock.playerUniverse.findMany.mockResolvedValue([])
  prismaMock.playerOverride.findMany.mockResolvedValue([])
  prismaMock.$transaction.mockResolvedValue([])
  prismaMock.playerUniverse.updateMany.mockResolvedValue({ count: 0 })
}

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("POST /api/admin/upload-universe — auth", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null })
    const res = await POST(makeRequest(VALID_CSV))
    expect(res.status).toBe(401)
  })

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({
      userId: "u1",
      sessionClaims: { metadata: { role: "user" } },
    })
    const res = await POST(makeRequest(VALID_CSV))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/admin/upload-universe — validation", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      userId: "u1",
      sessionClaims: { metadata: { role: "admin" } },
    })
  })

  it("returns 422 when file is missing", async () => {
    const req = new NextRequest("http://localhost/api/admin/upload-universe", {
      method: "POST",
      body: new FormData(),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/Missing file/)
  })

  it("returns 422 when required columns are missing", async () => {
    const res = await POST(makeRequest("WrongCol,Name\n1001,Aaron Judge"))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/Missing required columns/)
  })

  it("returns 422 when CSV has no data rows", async () => {
    const res = await POST(makeRequest(HDR))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/no data rows/)
  })

  it("skips rows with missing Ottoneu ID and returns 422 when no valid rows remain", async () => {
    const csv = [HDR, ",Aaron Judge,15640,,592450,1992-04-26,OF"].join("\n")
    setupHappyPath()
    const res = await POST(makeRequest(csv))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/No valid rows/)
  })
})

describe("POST /api/admin/upload-universe — upsert logic", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      userId: "u1",
      sessionClaims: { metadata: { role: "admin" } },
    })
  })

  it("returns correct counts for a successful upload", async () => {
    setupHappyPath()
    const res = await POST(makeRequest(VALID_CSV))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.inserted).toBe(2)
    expect(json.updated).toBe(0)
    expect(json.uploadedAt).toBeDefined()
  })

  it("counts existing ottoneuIds as updated, not inserted", async () => {
    prismaMock.player.findMany.mockResolvedValue([])
    prismaMock.playerUniverse.findMany.mockResolvedValue([
      {
        id: "pu-1",
        format: "ottoneu",
        ottoneuId: 1001,
        playerName: "Aaron Judge",
        positions: [],
        fangraphsId: null,
        mlbamId: null,
        birthday: null,
        playerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } satisfies PlayerUniverse,
    ])
    prismaMock.playerOverride.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([])
    prismaMock.playerUniverse.updateMany.mockResolvedValue({ count: 0 })

    const res = await POST(makeRequest(VALID_CSV))
    const json = await res.json()
    expect(json.inserted).toBe(1)
    expect(json.updated).toBe(1)
  })

  it("replace mode soft-deletes absent rows", async () => {
    setupHappyPath()
    prismaMock.playerUniverse.updateMany.mockResolvedValue({ count: 5 })

    const res = await POST(makeRequest(VALID_CSV, "replace"))
    const json = await res.json()
    expect(json.deleted).toBe(5)
    expect(prismaMock.playerUniverse.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ format: "ottoneu", deletedAt: null }),
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    )
  })

  it("additive mode does not soft-delete", async () => {
    setupHappyPath()
    const res = await POST(makeRequest(VALID_CSV, "additive"))
    const json = await res.json()
    expect(json.deleted).toBe(0)
    expect(prismaMock.playerUniverse.updateMany).not.toHaveBeenCalled()
  })
})

describe("POST /api/admin/upload-universe — player linking", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      userId: "u1",
      sessionClaims: { metadata: { role: "admin" } },
    })
  })

  it("sets playerId when matching Player exists by ottoneuId", async () => {
    prismaMock.player.findMany.mockResolvedValue([
      {
        id: "player-uuid-1",
        sfbbId: "15640",
        playerName: "Aaron Judge",
        fgSpecialChar: null,
        positions: [],
        team: null,
        mlbLevel: null,
        active: true,
        birthday: null,
        firstName: null,
        lastName: null,
        bats: null,
        throws: null,
        mlbamId: null,
        fangraphsId: null,
        cbsId: null,
        espnId: null,
        yahooId: null,
        fantraxId: null,
        retroId: null,
        nfbcId: null,
        bRefId: null,
        ottoneuId: 1001,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } satisfies Player,
    ])
    prismaMock.playerUniverse.findMany.mockResolvedValue([])
    prismaMock.playerOverride.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([])
    prismaMock.playerUniverse.updateMany.mockResolvedValue({ count: 0 })

    const csv = [HDR, "1001,Aaron Judge,15640,,592450,1992-04-26,OF"].join("\n")
    await POST(makeRequest(csv))

    expect(prismaMock.playerUniverse.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ playerId: "player-uuid-1" }),
      }),
    )
  })

  it("sets playerId to null when no matching Player exists", async () => {
    prismaMock.player.findMany.mockResolvedValue([])
    prismaMock.playerUniverse.findMany.mockResolvedValue([])
    prismaMock.playerOverride.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([])
    prismaMock.playerUniverse.updateMany.mockResolvedValue({ count: 0 })

    const csv = [HDR, "1001,Aaron Judge,15640,,592450,1992-04-26,OF"].join("\n")
    await POST(makeRequest(csv))

    expect(prismaMock.playerUniverse.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ playerId: null }),
      }),
    )
  })
})
