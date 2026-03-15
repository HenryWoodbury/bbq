import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type {
  LeagueMember,
  PrismaClient,
  Team,
  TeamManager,
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
import { PATCH } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

type TeamWithRelations = Team & { managers: TeamManager[]; rosterHistory: [] }

const mockTeamOwnedByUser = {
  id: "team-1",
  leagueId: "league-1",
  teamName: "My Team",
  currentRoster: {},
  financeData: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  managers: [
    { clerkUserId: "user_1", teamId: "team-1", isPrimary: true, createdAt: new Date() },
  ] satisfies TeamManager[],
  rosterHistory: [],
} satisfies TeamWithRelations

const mockTeamOwnedByOther = {
  ...mockTeamOwnedByUser,
  managers: [
    { clerkUserId: "other_user", teamId: "team-1", isPrimary: true, createdAt: new Date() },
  ] satisfies TeamManager[],
} satisfies TeamWithRelations

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

// resolveTeam calls team.findFirst then leagueMember.findUnique (membership check).
// getLeagueRole also calls leagueMember.findUnique (role check, sequential after resolveTeam).
// mockResolvedValue (not Once) returns the same value for all calls.
function setupTeam(team: TeamWithRelations | null) {
  prismaMock.team.findFirst.mockResolvedValue(team)
}

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

describe("PATCH /api/teams/[id]", () => {
  it("returns 200 for manager patching their own team", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    setupTeam(mockTeamOwnedByUser)
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      clerkUserId: "user_1",
      leagueId: "league-1",
      role: LeagueMemberRole.MANAGER,
      createdAt: new Date(),
    } satisfies LeagueMember)
    prismaMock.team.update.mockResolvedValue({
      ...mockTeamOwnedByUser,
      teamName: "Updated",
    })

    const req = new NextRequest("http://localhost/api/teams/team-1", {
      method: "PATCH",
      body: JSON.stringify({ teamName: "Updated" }),
    })
    const res = await PATCH(req, makeParams("team-1"))
    expect(res.status).toBe(200)
  })

  it("returns 403 for manager patching another team", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    setupTeam(mockTeamOwnedByOther)
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      clerkUserId: "user_1",
      leagueId: "league-1",
      role: LeagueMemberRole.MANAGER,
      createdAt: new Date(),
    } satisfies LeagueMember)

    const req = new NextRequest("http://localhost/api/teams/team-1", {
      method: "PATCH",
      body: JSON.stringify({ teamName: "Steal" }),
    })
    const res = await PATCH(req, makeParams("team-1"))
    expect(res.status).toBe(403)
  })

  it("returns 200 for commissioner patching any team", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "admin_user" })
    setupTeam(mockTeamOwnedByOther)
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      clerkUserId: "admin_user",
      leagueId: "league-1",
      role: LeagueMemberRole.COMMISSIONER,
      createdAt: new Date(),
    } satisfies LeagueMember)
    prismaMock.team.update.mockResolvedValue({
      ...mockTeamOwnedByOther,
      teamName: "Override",
    })

    const req = new NextRequest("http://localhost/api/teams/team-1", {
      method: "PATCH",
      body: JSON.stringify({ teamName: "Override" }),
    })
    const res = await PATCH(req, makeParams("team-1"))
    expect(res.status).toBe(200)
  })
})
