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
import { PATCH, DELETE } from './route';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const mockLeague = {
  id: 'league-1',
  clerkOrgId: 'org_test',
  leagueName: 'Test League',
  deletedAt: null,
} as any;

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe('PATCH /api/leagues/[id]', () => {
  it('returns 403 for ONLOOKER', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    prismaMock.league.findFirst.mockResolvedValueOnce({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({ role: LeagueMemberRole.ONLOOKER } as any);

    const req = new NextRequest('http://localhost/api/leagues/league-1', {
      method: 'PATCH',
      body: JSON.stringify({ leagueName: 'New Name' }),
    });
    const res = await PATCH(req, makeParams('league-1'));
    expect(res.status).toBe(403);
  });

  it('returns 403 for MANAGER', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    prismaMock.league.findFirst.mockResolvedValueOnce({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({ role: LeagueMemberRole.MANAGER } as any);

    const req = new NextRequest('http://localhost/api/leagues/league-1', {
      method: 'PATCH',
      body: JSON.stringify({ leagueName: 'New Name' }),
    });
    const res = await PATCH(req, makeParams('league-1'));
    expect(res.status).toBe(403);
  });

  it('returns 200 for COMMISSIONER', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    prismaMock.league.findFirst
      .mockResolvedValueOnce({ id: 'league-1' } as any)  // getLeagueRole
      .mockResolvedValueOnce(mockLeague);                  // resolveLeague
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.COMMISSIONER,
    } as any);
    prismaMock.league.update.mockResolvedValue({ ...mockLeague, leagueName: 'New Name' } as any);

    const req = new NextRequest('http://localhost/api/leagues/league-1', {
      method: 'PATCH',
      body: JSON.stringify({ leagueName: 'New Name' }),
    });
    const res = await PATCH(req, makeParams('league-1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.leagueName).toBe('New Name');
  });
});

describe('DELETE /api/leagues/[id]', () => {
  it('returns 403 for CO_COMMISSIONER', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    prismaMock.league.findFirst.mockResolvedValueOnce({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.CO_COMMISSIONER,
    } as any);

    const req = new NextRequest('http://localhost/api/leagues/league-1', { method: 'DELETE' });
    const res = await DELETE(req, makeParams('league-1'));
    expect(res.status).toBe(403);
  });

  it('returns 204 for COMMISSIONER', async () => {
    mockAuthProtect.mockResolvedValue({ orgId: 'org_test', userId: 'user_1' });
    prismaMock.league.findFirst
      .mockResolvedValueOnce({ id: 'league-1' } as any)  // getLeagueRole
      .mockResolvedValueOnce(mockLeague);                  // resolveLeague
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.COMMISSIONER,
    } as any);
    prismaMock.league.update.mockResolvedValue(mockLeague);

    const req = new NextRequest('http://localhost/api/leagues/league-1', { method: 'DELETE' });
    const res = await DELETE(req, makeParams('league-1'));
    expect(res.status).toBe(204);
  });
});
