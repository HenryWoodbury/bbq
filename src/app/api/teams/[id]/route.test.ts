import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockReset } from 'vitest-mock-extended';
import type { DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@/generated/prisma/client';
import { LeagueMemberRole } from '@/generated/prisma/client';

const { mockAuthProtect } = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: Object.assign(vi.fn(), { protect: mockAuthProtect }),
}));
vi.mock('@/lib/prisma');

import { prisma } from '@/lib/prisma';
import { PATCH } from './route';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const mockLeague = { id: 'league-1', clerkOrgId: 'org_test', deletedAt: null } as any;

const mockTeamOwnedByUser = {
  id: 'team-1',
  leagueId: 'league-1',
  teamName: 'My Team',
  deletedAt: null,
  managers: [{ clerkUserId: 'user_1' }],
  rosterHistory: [],
} as any;

const mockTeamOwnedByOther = {
  ...mockTeamOwnedByUser,
  managers: [{ clerkUserId: 'other_user' }],
} as any;

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// resolveTeam calls league.findFirst then team.findFirst.
// getLeagueRole also calls league.findFirst — both run in parallel via Promise.all.
// mockResolvedValue (not Once) returns the same value for all parallel calls.
function setupTeamAndLeague(team: any) {
  prismaMock.league.findFirst.mockResolvedValue(mockLeague);
  prismaMock.team.findFirst.mockResolvedValue(team);
}

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe('PATCH /api/teams/[id]', () => {
  it('returns 200 for manager patching their own team', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    setupTeamAndLeague(mockTeamOwnedByUser);
    prismaMock.leagueMember.findUnique.mockResolvedValue({ role: LeagueMemberRole.MANAGER } as any);
    prismaMock.team.update.mockResolvedValue({ ...mockTeamOwnedByUser, teamName: 'Updated' } as any);

    const req = new NextRequest('http://localhost/api/teams/team-1', {
      method: 'PATCH',
      body: JSON.stringify({ teamName: 'Updated' }),
    });
    const res = await PATCH(req, makeParams('team-1'));
    expect(res.status).toBe(200);
  });

  it('returns 403 for manager patching another team', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    setupTeamAndLeague(mockTeamOwnedByOther);
    prismaMock.leagueMember.findUnique.mockResolvedValue({ role: LeagueMemberRole.MANAGER } as any);

    const req = new NextRequest('http://localhost/api/teams/team-1', {
      method: 'PATCH',
      body: JSON.stringify({ teamName: 'Steal' }),
    });
    const res = await PATCH(req, makeParams('team-1'));
    expect(res.status).toBe(403);
  });

  it('returns 200 for commissioner patching any team', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'admin_user' });
    setupTeamAndLeague(mockTeamOwnedByOther);
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.COMMISSIONER,
    } as any);
    prismaMock.team.update.mockResolvedValue({ ...mockTeamOwnedByOther, teamName: 'Override' } as any);

    const req = new NextRequest('http://localhost/api/teams/team-1', {
      method: 'PATCH',
      body: JSON.stringify({ teamName: 'Override' }),
    });
    const res = await PATCH(req, makeParams('team-1'));
    expect(res.status).toBe(200);
  });
});
