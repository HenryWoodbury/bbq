import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type {
  League,
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

// resolveTeam now includes league.members for the membership check in a single query.
// getLeagueRole still calls leagueMember.findUnique for the role check in PATCH.
type TeamWithRelations = Team & {
  managers: TeamManager[]
  rosterHistory: []
  league: League & { members: LeagueMember[] }
}

const mockLeague: League = {
  id: "league-1",
  clerkOrgId: "org_test",
  leagueName: "Test League",
  templateId: null,
  hostLeagueUrl: null,
  seasons: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

function makeMemberForUser(
  clerkUserId: string,
  role: LeagueMemberRole,
): LeagueMember {
  return {
    clerkUserId,
    leagueId: "league-1",
    role,
    createdAt: new Date(),
    deletedAt: null,
  }
}

function makeTeam(
  overrides: Partial<TeamWithRelations> = {},
): TeamWithRelations {
  return {
    id: "team-1",
    leagueId: "league-1",
    teamName: "My Team",
    currentRoster: {},
    financeData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    managers: [
      {
        clerkUserId: "user_1",
        teamId: "team-1",
        isPrimary: true,
        createdAt: new Date(),
        deletedAt: null,
      },
    ],
    rosterHistory: [],
    league: {
      ...mockLeague,
      members: [makeMemberForUser("user_1", LeagueMemberRole.MANAGER)],
    },
    ...overrides,
  }
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

describe("PATCH /api/teams/[id]", () => {
  it("returns 200 for manager patching their own team", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "user_1" })
    prismaMock.team.findFirst.mockResolvedValue(makeTeam())
    // getLeagueRole call for role check
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMemberForUser("user_1", LeagueMemberRole.MANAGER),
    )
    prismaMock.team.update.mockResolvedValue({
      ...makeTeam(),
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
    // Team is owned by a different user; user_1 is a member of the league but not a manager of this team
    prismaMock.team.findFirst.mockResolvedValue(
      makeTeam({
        managers: [
          {
            clerkUserId: "other_user",
            teamId: "team-1",
            isPrimary: true,
            createdAt: new Date(),
            deletedAt: null,
          },
        ],
      }),
    )
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMemberForUser("user_1", LeagueMemberRole.MANAGER),
    )

    const req = new NextRequest("http://localhost/api/teams/team-1", {
      method: "PATCH",
      body: JSON.stringify({ teamName: "Steal" }),
    })
    const res = await PATCH(req, makeParams("team-1"))
    expect(res.status).toBe(403)
  })

  it("returns 200 for commissioner patching any team", async () => {
    mockAuthProtect.mockResolvedValue({ userId: "admin_user" })
    prismaMock.team.findFirst.mockResolvedValue(
      makeTeam({
        managers: [
          {
            clerkUserId: "other_user",
            teamId: "team-1",
            isPrimary: true,
            createdAt: new Date(),
            deletedAt: null,
          },
        ],
        league: {
          ...mockLeague,
          members: [
            makeMemberForUser("admin_user", LeagueMemberRole.COMMISSIONER),
          ],
        },
      }),
    )
    prismaMock.leagueMember.findUnique.mockResolvedValue(
      makeMemberForUser("admin_user", LeagueMemberRole.COMMISSIONER),
    )
    prismaMock.team.update.mockResolvedValue({
      ...makeTeam(),
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
