import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockReset } from 'vitest-mock-extended';
import type { DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@/generated/prisma/client';

const { mockAuth, mockAuthProtect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockAuthProtect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: Object.assign(mockAuth, { protect: mockAuthProtect }),
}));
vi.mock('@/lib/prisma');

import { prisma } from '@/lib/prisma';
import { GET, POST } from './route';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe('GET /api/players', () => {
  it('returns paginated players', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'u1', orgId: 'o1' });
    prismaMock.player.findMany.mockResolvedValue([{ id: '1', playerName: 'Test Player' } as any]);
    prismaMock.player.count.mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/players');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
  });

  it('passes search param to query', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'u1', orgId: 'o1' });
    prismaMock.player.findMany.mockResolvedValue([]);
    prismaMock.player.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/players?search=judge');
    await GET(req);

    expect(prismaMock.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          playerName: expect.objectContaining({ contains: 'judge' }),
        }),
      }),
    );
  });

  it('filters by position', async () => {
    mockAuthProtect.mockResolvedValue({ userId: 'u1', orgId: 'o1' });
    prismaMock.player.findMany.mockResolvedValue([]);
    prismaMock.player.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/players?position=SP');
    await GET(req);

    expect(prismaMock.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ positions: { has: 'SP' } }),
      }),
    );
  });

  it('rejects when unauthenticated', async () => {
    mockAuthProtect.mockRejectedValue(new Error('Unauthenticated'));
    const req = new NextRequest('http://localhost/api/players');
    await expect(GET(req)).rejects.toThrow('Unauthenticated');
  });
});

describe('POST /api/players', () => {
  it('returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: {} } });

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ sfbbId: 'p1', playerName: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ sfbbId: 'p1', playerName: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when sfbbId is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'No ID' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when playerName is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ sfbbId: 'p1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates player and returns 201 for admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    prismaMock.player.create.mockResolvedValue({
      id: 'db-1',
      sfbbId: 'p1',
      playerName: 'Aaron Judge',
    } as any);

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ sfbbId: 'p1', playerName: 'Aaron Judge' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.playerName).toBe('Aaron Judge');
  });

  it('parses positions string into array', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    prismaMock.player.create.mockResolvedValue({ id: 'db-1', sfbbId: 'p1', playerName: 'Test' } as any);

    const req = new NextRequest('http://localhost/api/players', {
      method: 'POST',
      body: JSON.stringify({ sfbbId: 'p1', playerName: 'Test', positions: 'SP/RP' }),
    });
    await POST(req);

    expect(prismaMock.player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ positions: ['SP', 'RP'] }),
      }),
    );
  });
});
