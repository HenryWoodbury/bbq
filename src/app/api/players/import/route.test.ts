import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockReset } from 'vitest-mock-extended';
import type { DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@/generated/prisma/client';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma');

import { prisma } from '@/lib/prisma';
import { POST } from './route';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const VALID_CSV = [
  'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
  '15640,Aaron Judge,1992-04-26,OF,NYY,MLB,Y,592450,15640,,,,,,,,'
].join('\n');

function makeFormRequest(csv: string | null, mode = 'replace') {
  const formData = new FormData();
  if (csv !== null) {
    formData.append('file', new Blob([csv], { type: 'text/csv' }), 'players.csv');
  }
  formData.append('mode', mode);
  return new NextRequest('http://localhost/api/players/import', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

describe('POST /api/players/import — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
    const res = await POST(makeFormRequest(VALID_CSV));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } });
    const res = await POST(makeFormRequest(VALID_CSV));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/players/import — validation', () => {
  it('returns 400 when no file is provided', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const res = await POST(makeFormRequest(null));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/No file/);
  });

  it('returns 400 when CSV has wrong column headers', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const res = await POST(makeFormRequest('Name,ID\nJudge,1'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Missing required columns/);
  });

  it('returns 422 when rows have validation errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const csv = [
      'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
      ',No ID Here,,,,,,,,,,,,,,,',
    ].join('\n');
    const res = await POST(makeFormRequest(csv));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.errorCount).toBeGreaterThan(0);
  });
});

describe('POST /api/players/import — upsert', () => {
  it('returns 200 with counts for a valid CSV', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    prismaMock.player.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.player.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeFormRequest(VALID_CSV));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.inserted).toBe(1);
    expect(json.importedAt).toBeDefined();
  });

  it('soft-deletes absent players in replace mode', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    prismaMock.player.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.player.updateMany.mockResolvedValue({ count: 7 });

    const res = await POST(makeFormRequest(VALID_CSV, 'replace'));
    const json = await res.json();
    expect(json.deleted).toBe(7);
    expect(prismaMock.player.updateMany).toHaveBeenCalled();
  });

  it('skips soft-delete in additive mode', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    prismaMock.player.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await POST(makeFormRequest(VALID_CSV, 'additive'));
    const json = await res.json();
    expect(json.deleted).toBe(0);
    expect(prismaMock.player.updateMany).not.toHaveBeenCalled();
  });
});
