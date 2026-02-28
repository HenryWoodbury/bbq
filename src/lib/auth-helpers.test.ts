import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import type { DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@/generated/prisma/client';
import { LeagueMemberRole } from '@/generated/prisma/client';

const { mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('next/navigation', () => ({ redirect: mockRedirect }));
vi.mock('@/lib/prisma');

import { prisma } from '@/lib/prisma';
import {
  isAdminFromClaims,
  requireAdmin,
  assertAdmin,
  getLeagueRole,
  assertLeagueRole,
} from './auth-helpers';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe('isAdminFromClaims', () => {
  it('returns true for admin role', async () => {
    mockAuth.mockResolvedValue({ sessionClaims: { metadata: { role: 'admin' } } });
    expect(await isAdminFromClaims()).toBe(true);
  });

  it('returns false for non-admin role', async () => {
    mockAuth.mockResolvedValue({ sessionClaims: { metadata: { role: 'user' } } });
    expect(await isAdminFromClaims()).toBe(false);
  });

  it('returns false when sessionClaims is null', async () => {
    mockAuth.mockResolvedValue({ sessionClaims: null });
    expect(await isAdminFromClaims()).toBe(false);
  });
});

describe('requireAdmin', () => {
  it('calls redirect when userId is null', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
    await requireAdmin();
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('calls redirect when role is not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } });
    await requireAdmin();
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('does not redirect for admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    await requireAdmin();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe('assertAdmin', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
    const res = await assertAdmin();
    expect(res?.status).toBe(401);
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } });
    const res = await assertAdmin();
    expect(res?.status).toBe(403);
  });

  it('returns undefined for admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const res = await assertAdmin();
    expect(res).toBeUndefined();
  });
});

describe('getLeagueRole', () => {
  it('returns null when no league found', async () => {
    prismaMock.league.findFirst.mockResolvedValue(null);
    expect(await getLeagueRole('org_1', 'user_1')).toBeNull();
  });

  it('returns null when user is not a member', async () => {
    prismaMock.league.findFirst.mockResolvedValue({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue(null);
    expect(await getLeagueRole('org_1', 'user_1')).toBeNull();
  });

  it('returns the member role', async () => {
    prismaMock.league.findFirst.mockResolvedValue({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.COMMISSIONER,
    } as any);
    expect(await getLeagueRole('org_1', 'user_1')).toBe(LeagueMemberRole.COMMISSIONER);
  });
});

describe('assertLeagueRole', () => {
  it('returns 403 when role is not in allowed list', async () => {
    prismaMock.league.findFirst.mockResolvedValue({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.ONLOOKER,
    } as any);
    const res = await assertLeagueRole('org_1', 'user_1', [LeagueMemberRole.COMMISSIONER]);
    expect(res?.status).toBe(403);
  });

  it('returns 403 when user has no league role', async () => {
    prismaMock.league.findFirst.mockResolvedValue(null);
    const res = await assertLeagueRole('org_1', 'user_1', [LeagueMemberRole.COMMISSIONER]);
    expect(res?.status).toBe(403);
  });

  it('returns undefined for allowed role', async () => {
    prismaMock.league.findFirst.mockResolvedValue({ id: 'league-1' } as any);
    prismaMock.leagueMember.findUnique.mockResolvedValue({
      role: LeagueMemberRole.COMMISSIONER,
    } as any);
    const res = await assertLeagueRole('org_1', 'user_1', [LeagueMemberRole.COMMISSIONER]);
    expect(res).toBeUndefined();
  });
});
