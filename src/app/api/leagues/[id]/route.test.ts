import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type {
  League,
  LeagueMember,
  PrismaClient,
} from "@/generated/prisma/client"
import { LeagueMemberRole } from "@/generated/prisma/client"

const { mockAuthProtect } = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(vi.fn(), { protect: mockAuthProtect }),
}))
vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { DELETE, PATCH } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const mockLeague = {
  id: "league-1",
  clerkOrgId: "org_test",
  leagueName: "Test League",
  templateId: null,
  hostLeagueUrl: null,
  seasons: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} satisfies League

function makeMember(role: LeagueMemberRole): LeagueMember {
  return {
    clerkUserId: "user_1",
    leagueId: "league-1",
    role,
    createdAt: new Date(),
    deletedAt: null,
  }
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

describe("PATCH /api/leagues/[id]", () => {
  it("returns 403 for ONLOOKER", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMember(LeagueMemberRole.ONLOOKER),
    )

    const req = new NextRequest("http://localhost/api/leagues/league-1", {
      method: "PATCH",
      body: JSON.stringify({ leagueName: "New Name" }),
    })
    const res = await PATCH(req, makeParams("league-1"))
    expect(res.status).toBe(403)
  })

  it("returns 403 for MANAGER", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMember(LeagueMemberRole.MANAGER),
    )

    const req = new NextRequest("http://localhost/api/leagues/league-1", {
      method: "PATCH",
      body: JSON.stringify({ leagueName: "New Name" }),
    })
    const res = await PATCH(req, makeParams("league-1"))
    expect(res.status).toBe(403)
  })

  it("returns 200 for COMMISSIONER", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMember(LeagueMemberRole.COMMISSIONER),
    )
    prismaMock.league.findFirst.mockResolvedValue(mockLeague)
    prismaMock.league.update.mockResolvedValue({
      ...mockLeague,
      leagueName: "New Name",
    } satisfies League)

    const req = new NextRequest("http://localhost/api/leagues/league-1", {
      method: "PATCH",
      body: JSON.stringify({ leagueName: "New Name" }),
    })
    const res = await PATCH(req, makeParams("league-1"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.leagueName).toBe("New Name")
  })
})

describe("DELETE /api/leagues/[id]", () => {
  it("returns 403 for CO_COMMISSIONER", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMember(LeagueMemberRole.CO_COMMISSIONER),
    )

    const req = new NextRequest("http://localhost/api/leagues/league-1", {
      method: "DELETE",
    })
    const res = await DELETE(req, makeParams("league-1"))
    expect(res.status).toBe(403)
  })

  it("returns 204 for COMMISSIONER", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMember(LeagueMemberRole.COMMISSIONER),
    )
    prismaMock.league.findFirst.mockResolvedValue(mockLeague)
    prismaMock.team.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([])

    const req = new NextRequest("http://localhost/api/leagues/league-1", {
      method: "DELETE",
    })
    const res = await DELETE(req, makeParams("league-1"))
    expect(res.status).toBe(204)
  })
})
