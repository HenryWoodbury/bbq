import { prisma } from "@/lib/prisma";
import { chunk } from "@/lib/csv";

export interface ReconcileResult {
  /** PlayerUniverse rows that received a playerId via FG/MLBAM match */
  linked: number;
  /** Player rows that received an ottoneuId from a linked universe row */
  ottoneuIdsFilled: number;
  /** Manual PlayerOverride rows auto-linked to a canonical Player */
  manualOverridesLinked: number;
}

/**
 * Cross-references Player and PlayerUniverse (format="ottoneu") to fill in
 * missing links and ottoneuIds after a sync or universe upload.
 *
 * Matching priority:
 *   1. Numeric FG ID  — Player.fangraphsId (Int) ↔ PlayerUniverse.fangraphsId (numeric string)
 *   2. MLBAM ID       — Player.mlbamId ↔ PlayerUniverse.mlbamId (covers minor leaguers)
 */
export async function reconcilePlayerIds(): Promise<ReconcileResult> {
  // ── Fetch unlinked universe rows ──────────────────────────────────────────
  const unlinked = await prisma.playerUniverse.findMany({
    where: { format: "ottoneu", deletedAt: null, playerId: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  });

  // ── Build lookup maps from all non-deleted Players ────────────────────────
  const allPlayers = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  });

  const byFgId = new Map<string, (typeof allPlayers)[0]>();
  const byMlbamId = new Map<number, (typeof allPlayers)[0]>();
  const byOttoneuId = new Map<number, (typeof allPlayers)[0]>();
  for (const p of allPlayers) {
    if (p.fangraphsId !== null) byFgId.set(p.fangraphsId, p);
    if (p.mlbamId !== null) byMlbamId.set(p.mlbamId, p);
    if (p.ottoneuId !== null) byOttoneuId.set(p.ottoneuId, p);
  }

  // ── Match unlinked universe rows to Players ───────────────────────────────
  const universeLinks: { id: string; playerId: string }[] = [];
  const ottoneuFills: { id: string; ottoneuId: number }[] = [];
  const filledPlayerIds = new Set<string>();

  for (const u of unlinked) {
    let player: (typeof allPlayers)[0] | undefined;

    // 1. FG ID — direct string match (covers numeric and "sa…" minor-league IDs)
    if (u.fangraphsId) player = byFgId.get(u.fangraphsId);
    // 2. MLBAM ID fallback
    if (!player && u.mlbamId !== null) player = byMlbamId.get(u.mlbamId);

    if (!player) continue;

    universeLinks.push({ id: u.id, playerId: player.id });

    if (player.ottoneuId === null && !filledPlayerIds.has(player.id)) {
      ottoneuFills.push({ id: player.id, ottoneuId: u.ottoneuId });
      filledPlayerIds.add(player.id);
    }
  }

  // ── Also catch Players already linked but still missing ottoneuId ─────────
  const linkedWithoutOttoneuId = await prisma.player.findMany({
    where: {
      deletedAt: null,
      ottoneuId: null,
      universe: { some: { format: "ottoneu", deletedAt: null } },
    },
    select: {
      id: true,
      universe: {
        where: { format: "ottoneu", deletedAt: null },
        select: { ottoneuId: true },
        take: 1,
      },
    },
  });
  for (const p of linkedWithoutOttoneuId) {
    const oid = p.universe[0]?.ottoneuId;
    if (oid !== undefined && !filledPlayerIds.has(p.id)) {
      ottoneuFills.push({ id: p.id, ottoneuId: oid });
      filledPlayerIds.add(p.id);
    }
  }

  // ── Commit in batches ─────────────────────────────────────────────────────
  for (const batch of chunk(universeLinks, 500)) {
    await prisma.$transaction(
      batch.map((u) =>
        prisma.playerUniverse.update({ where: { id: u.id }, data: { playerId: u.playerId } })
      )
    );
  }
  for (const batch of chunk(ottoneuFills, 500)) {
    await prisma.$transaction(
      batch.map((p) =>
        prisma.player.update({ where: { id: p.id }, data: { ottoneuId: p.ottoneuId } })
      )
    );
  }

  // ── Auto-link manual overrides to canonical Players ──────────────────────
  const manualOverrides = await prisma.playerOverride.findMany({
    where: { isManual: true, playerId: null, deletedAt: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  });

  const overrideLinks: { id: string; playerId: string }[] = [];
  for (const o of manualOverrides) {
    let player: (typeof allPlayers)[0] | undefined;
    if (o.fangraphsId) player = byFgId.get(o.fangraphsId);
    if (!player && o.mlbamId !== null) player = byMlbamId.get(o.mlbamId);
    if (!player && o.ottoneuId !== null) player = byOttoneuId.get(o.ottoneuId);
    if (player) overrideLinks.push({ id: o.id, playerId: player.id });
  }

  for (const batch of chunk(overrideLinks, 500)) {
    await prisma.$transaction(
      batch.map((o) =>
        prisma.playerOverride.update({ where: { id: o.id }, data: { playerId: o.playerId } })
      )
    );
  }

  return {
    linked: universeLinks.length,
    ottoneuIdsFilled: ottoneuFills.length,
    manualOverridesLinked: overrideLinks.length,
  };
}
