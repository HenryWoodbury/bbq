import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Minimal valid SFBB CSV with the confirmed column layout
const VALID_CSV = [
  'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
  '15640,Aaron Judge,1992-04-26,OF,NYY,MLB,Y,592450,15640,,79578,3900,,73927,judgaaa01,,judgear01',
  '19755,Shohei Ohtani,1994-07-05,SP,LAD,MLB,Y,660271,19755,,105270,36028,,73703,ohtash001,,ohtansh01',
].join('\n');

function mockFetch(csv: string, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: () => Promise.resolve(csv),
  });
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/sync-players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function setupHappyPath() {
  prismaMock.player.findMany.mockResolvedValue([]);
  prismaMock.$transaction.mockResolvedValue([]);
  prismaMock.player.updateMany.mockResolvedValue({ count: 0 });
}

beforeEach(() => {
  mockReset(prismaMock);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/admin/sync-players — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/sync-players — upstream fetch', () => {
  it('returns 502 when upstream returns non-200', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch('', 503));

    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
  });

  it('returns 502 when fetch throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/ECONNREFUSED/);
  });
});

describe('POST /api/admin/sync-players — CSV parsing', () => {
  it('returns 422 when IDPLAYER column is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch('WRONG,PLAYERNAME\n1,Judge'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/Missing required columns/);
  });

  it('returns 422 when PLAYERNAME column is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch('IDPLAYER,WRONG\n1,Judge'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(422);
  });

  it('returns 422 when CSV has no data rows', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch('IDPLAYER,PLAYERNAME'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(422);
  });

  it('skips rows with empty IDPLAYER or PLAYERNAME', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const csv = [
      'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
      ',No ID Player,,,,,Y,,,,,,,,,',
      '999,,,,,,Y,,,,,,,,,',
      '888,Valid Player,,,,,Y,,,,,,,,,',
    ].join('\n');
    vi.stubGlobal('fetch', mockFetch(csv));
    setupHappyPath();

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
  });
});

describe('POST /api/admin/sync-players — upsert logic', () => {
  it('returns counts for a successful sync', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch(VALID_CSV));
    setupHappyPath();

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(2);
    expect(json.inserted).toBe(2);
    expect(json.updated).toBe(0);
    expect(json.syncedAt).toBeDefined();
  });

  it('counts existing sfbbIds as updated, not inserted', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch(VALID_CSV));
    prismaMock.player.findMany.mockResolvedValue([{ sfbbId: '15640' } as any]);
    prismaMock.$transaction.mockResolvedValue([]);
    prismaMock.player.updateMany.mockResolvedValue({ count: 0 });

    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.inserted).toBe(1);
    expect(json.updated).toBe(1);
  });

  it('passes correct fields to upsert', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const csv = [
      'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
      '15640,Aaron Judge,1992-04-26,OF,NYY,MLB,Y,592450,15640,,79578,,,,,,'
    ].join('\n');
    vi.stubGlobal('fetch', mockFetch(csv));
    setupHappyPath();

    await POST(makeRequest());

    expect(prismaMock.player.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sfbbId: '15640' },
        create: expect.objectContaining({
          sfbbId: '15640',
          playerName: 'Aaron Judge',
          team: 'NYY',
          mlbLevel: 'MLB',
          active: true,
          mlbamId: 592450,
          fangraphsId: 15640,
          cbsId: 79578,
        }),
      }),
    );
  });

  it('correctly parses active: false when ACTIVE = N', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    const csv = [
      'IDPLAYER,PLAYERNAME,BIRTHDATE,POS,TEAM,LG,ACTIVE,MLBID,IDFANGRAPHS,FANGRAPHSMINORSID,CBSID,ESPNID,YAHOOID,FANTRAXID,RETROID,NFBCID,BREFID',
      '999,Old Timer,1975-01-01,OF,FA,MLB,N,,,,,,,,,,'
    ].join('\n');
    vi.stubGlobal('fetch', mockFetch(csv));
    setupHappyPath();

    await POST(makeRequest());

    expect(prismaMock.player.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ active: false }),
      }),
    );
  });
});

describe('POST /api/admin/sync-players — replace vs additive', () => {
  it('soft-deletes absent players in replace mode (default)', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch(VALID_CSV));
    setupHappyPath();
    prismaMock.player.updateMany.mockResolvedValue({ count: 12 });

    const res = await POST(makeRequest({ mode: 'replace' }));
    const json = await res.json();
    expect(json.deleted).toBe(12);
    expect(prismaMock.player.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('does not soft-delete in additive mode', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch(VALID_CSV));
    setupHappyPath();

    const res = await POST(makeRequest({ mode: 'additive' }));
    const json = await res.json();
    expect(json.deleted).toBe(0);
    expect(prismaMock.player.updateMany).not.toHaveBeenCalled();
  });

  it('defaults to replace mode when mode is omitted', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'admin' } } });
    vi.stubGlobal('fetch', mockFetch(VALID_CSV));
    setupHappyPath();

    await POST(makeRequest());
    expect(prismaMock.player.updateMany).toHaveBeenCalled();
  });
});
