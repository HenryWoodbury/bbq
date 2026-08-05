import { chunk } from "@/lib/csv"
import { excludeManualPlayers, onlyManualPlayers } from "@/lib/manual-players"
import { liveOverride } from "@/lib/player-effective"
import { prisma } from "@/lib/prisma"

export interface ReconcileResult {
  /** PlayerUniverse rows that received a playerId via FG/MLBAM match */
  linked: number
  /** Player rows that received an ottoneuId from a linked universe row */
  ottoneuIdsFilled: number
  /** Manual PlayerOverride rows auto-linked to a canonical Player */
  manualOverridesLinked: number
  /** Synthetic manual Player rows folded into a real SFBB Player */
  manualPlayersMerged: number
}

/** Stable identity for PlayerStat's compound unique key, minus playerId. */
function statKey(s: {
  season: number
  playerType: string
  projection: string
  neutralized: boolean
  split: string
  ros: boolean
}): string {
  return [
    s.season,
    s.playerType,
    s.projection,
    s.neutralized,
    s.split,
    s.ros,
  ].join("|")
}

/**
 * Folds a synthetic manual Player into the real SFBB Player that now covers the
 * same person, then retires the synthetic row.
 *
 * Without this, a manual add made before SFBB publishes a player would leave two
 * Player rows sharing one FangraphsId — the manual one holding the uploaded
 * stats, the real one holding the canonical profile.
 */
async function mergeSyntheticPlayer(
  syntheticId: string,
  realId: string,
): Promise<void> {
  // One retirement, one timestamp — the losing stat rows and the synthetic
  // player they belonged to are retired by the same act.
  const retiredAt = new Date()

  await prisma.$transaction(async (tx) => {
    // PlayerStat carries a compound unique key that includes playerId, so a row
    // whose key the real player already holds cannot simply be repointed.
    //
    // That key does *not* include deletedAt, so a retired row on the real player
    // still occupies it. Only a live real row is a genuine winner: letting a
    // retired one claim the key would drop the synthetic player's uploaded
    // projection in favour of a row no view can see — the very symptom the
    // manual-player fix exists to remove.
    const keySelect = {
      season: true,
      playerType: true,
      projection: true,
      neutralized: true,
      split: true,
      ros: true,
    } as const
    const [syntheticStats, realStats] = await Promise.all([
      tx.playerStat.findMany({
        where: { playerId: syntheticId },
        select: { id: true, deletedAt: true, ...keySelect },
      }),
      tx.playerStat.findMany({
        where: { playerId: realId },
        select: { id: true, deletedAt: true, ...keySelect },
      }),
    ])

    const liveRealKeys = new Set(
      realStats.filter((s) => s.deletedAt === null).map(statKey),
    )
    const retiredRealByKey = new Map(
      realStats
        .filter((s) => s.deletedAt !== null)
        .map((s) => [statKey(s), s.id]),
    )

    const movable: string[] = []
    const supersededRealIds: string[] = []
    const losers: string[] = []

    for (const s of syntheticStats) {
      const key = statKey(s)
      if (liveRealKeys.has(key)) {
        // The real player's own live row wins; retire the synthetic's copy.
        if (s.deletedAt === null) losers.push(s.id)
        continue
      }
      const retiredRealId = retiredRealByKey.get(key)
      if (retiredRealId !== undefined) {
        // Both sides retired — nothing worth moving; leave it on the synthetic
        // player, which is soft-deleted at the end of this transaction.
        if (s.deletedAt !== null) continue
        // A live row is about to take this key, so the retired real row has to
        // go. Hard delete is the only option — the unique constraint admits one
        // row per key regardless of deletedAt — and it discards nothing visible.
        // No second synthetic row can want this key: they share one playerId, so
        // the same unique constraint makes their keys distinct.
        supersededRealIds.push(retiredRealId)
      }
      movable.push(s.id)
    }

    // Free the keys before repointing, or the update trips the constraint.
    if (supersededRealIds.length > 0) {
      await tx.playerStat.deleteMany({
        where: { id: { in: supersededRealIds } },
      })
    }
    if (movable.length > 0) {
      await tx.playerStat.updateMany({
        where: { id: { in: movable } },
        data: { playerId: realId },
      })
    }
    if (losers.length > 0) {
      await tx.playerStat.updateMany({
        where: { id: { in: losers } },
        data: { deletedAt: retiredAt },
      })
    }

    await tx.rosterHistory.updateMany({
      where: { playerId: syntheticId },
      data: { playerId: realId },
    })
    await tx.playerUniverse.updateMany({
      where: { playerId: syntheticId },
      data: { playerId: realId },
    })

    // PlayerOverride.playerId is unique, so the manual override can only be
    // repointed when the real player has none. Otherwise its values fill the
    // gaps in the existing override, which keeps the admin's manual edits.
    //
    // Liveness governs both sides symmetrically: a retired override's values are
    // withdrawn, and must neither be inherited from nor overwritten by.
    const [syntheticOverride, realOverride] = await Promise.all([
      tx.playerOverride.findUnique({ where: { playerId: syntheticId } }),
      tx.playerOverride.findUnique({ where: { playerId: realId } }),
    ])

    const liveSyntheticOverride = liveOverride(syntheticOverride)
    // A retired manual override was cleared by an admin (see
    // `DELETE /api/admin/players/[id]/override`, which retires the override
    // without touching the Player). Its values must not travel to the real
    // player, and repointing it would only park a dead row in the unique slot —
    // so leave it on the synthetic player, which is soft-deleted below.
    if (liveSyntheticOverride) {
      const liveRealOverride = liveOverride(realOverride)
      if (!realOverride) {
        await tx.playerOverride.update({
          where: { id: liveSyntheticOverride.id },
          data: { playerId: realId },
        })
      } else if (!liveRealOverride) {
        // The real player's override is retired, so its values are stale and
        // must not beat the admin's manual data. Detach it — playerId is unique
        // and it stays soft-deleted, so this loses no history — then move the
        // manual override into the slot it vacated.
        await tx.playerOverride.update({
          where: { id: realOverride.id },
          data: { playerId: null },
        })
        await tx.playerOverride.update({
          where: { id: liveSyntheticOverride.id },
          data: { playerId: realId },
        })
      } else {
        // Both live: the real player's own values win field by field, and the
        // manual override fills only the gaps.
        const fill = <T>(current: T | null, incoming: T | null): T | null =>
          current ?? incoming
        await tx.playerOverride.update({
          where: { id: liveRealOverride.id },
          data: {
            isManual: true,
            displayName: fill(
              liveRealOverride.displayName,
              liveSyntheticOverride.displayName,
            ),
            firstName: fill(
              liveRealOverride.firstName,
              liveSyntheticOverride.firstName,
            ),
            lastName: fill(
              liveRealOverride.lastName,
              liveSyntheticOverride.lastName,
            ),
            nickname: fill(
              liveRealOverride.nickname,
              liveSyntheticOverride.nickname,
            ),
            birthday: fill(
              liveRealOverride.birthday,
              liveSyntheticOverride.birthday,
            ),
            team: fill(liveRealOverride.team, liveSyntheticOverride.team),
            mlbLevel: fill(
              liveRealOverride.mlbLevel,
              liveSyntheticOverride.mlbLevel,
            ),
            league: fill(liveRealOverride.league, liveSyntheticOverride.league),
            active: fill(liveRealOverride.active, liveSyntheticOverride.active),
            bats: fill(liveRealOverride.bats, liveSyntheticOverride.bats),
            throws: fill(liveRealOverride.throws, liveSyntheticOverride.throws),
            positions:
              liveRealOverride.positions.length > 0
                ? liveRealOverride.positions
                : liveSyntheticOverride.positions,
            fangraphsId: fill(
              liveRealOverride.fangraphsId,
              liveSyntheticOverride.fangraphsId,
            ),
            mlbamId: fill(
              liveRealOverride.mlbamId,
              liveSyntheticOverride.mlbamId,
            ),
            ottoneuId: fill(
              liveRealOverride.ottoneuId,
              liveSyntheticOverride.ottoneuId,
            ),
          },
        })
        await tx.playerOverride.delete({
          where: { id: liveSyntheticOverride.id },
        })
      }
    }

    await tx.player.update({
      where: { id: syntheticId },
      data: { deletedAt: retiredAt },
    })
  })
}

/** Matches synthetic manual Players against real SFBB Players on FG/MLBAM id
 *  and merges each pair. Returns the number merged. */
async function mergeSyntheticPlayers(): Promise<number> {
  const synthetic = await prisma.player.findMany({
    where: onlyManualPlayers({ deletedAt: null }),
    select: { id: true, fangraphsId: true, mlbamId: true },
  })
  if (synthetic.length === 0) return 0

  const fgIds = synthetic
    .map((s) => s.fangraphsId)
    .filter((id): id is string => id !== null)
  const mlbamIds = synthetic
    .map((s) => s.mlbamId)
    .filter((id): id is number => id !== null)
  // With no ids to match on, an empty OR would match every player.
  if (fgIds.length === 0 && mlbamIds.length === 0) return 0

  const real = await prisma.player.findMany({
    where: excludeManualPlayers({
      deletedAt: null,
      OR: [
        ...(fgIds.length > 0 ? [{ fangraphsId: { in: fgIds } }] : []),
        ...(mlbamIds.length > 0 ? [{ mlbamId: { in: mlbamIds } }] : []),
      ],
    }),
    select: { id: true, fangraphsId: true, mlbamId: true },
  })
  if (real.length === 0) return 0

  const realByFgId = new Map<string, string>()
  const realByMlbamId = new Map<number, string>()
  for (const p of real) {
    if (p.fangraphsId !== null && !realByFgId.has(p.fangraphsId))
      realByFgId.set(p.fangraphsId, p.id)
    if (p.mlbamId !== null && !realByMlbamId.has(p.mlbamId))
      realByMlbamId.set(p.mlbamId, p.id)
  }

  let merged = 0
  for (const s of synthetic) {
    const realId =
      (s.fangraphsId !== null ? realByFgId.get(s.fangraphsId) : undefined) ??
      (s.mlbamId !== null ? realByMlbamId.get(s.mlbamId) : undefined)
    if (realId === undefined || realId === s.id) continue
    await mergeSyntheticPlayer(s.id, realId)
    merged++
  }
  return merged
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
  // ── Collapse synthetic manual players into real SFBB players ──────────────
  // Runs first so the id lookup maps below cannot resolve to a synthetic player
  // that is about to be retired.
  const manualPlayersMerged = await mergeSyntheticPlayers()

  // ── Fetch the rows that still need a Player ───────────────────────────────
  const [unlinked, manualOverrides] = await Promise.all([
    prisma.playerUniverse.findMany({
      where: { format: "ottoneu", deletedAt: null, playerId: null },
      select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
    }),
    prisma.playerOverride.findMany({
      where: { isManual: true, playerId: null, deletedAt: null },
      select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
    }),
  ])

  // ── Build lookup maps from only the Players those rows could match ────────
  // The maps are probed exclusively with ids drawn from the two sets above, so
  // loading every non-deleted Player was wasted work — and it made a one-row
  // manual add cost a full table scan. All three columns are indexed.
  const wantedFgIds = new Set<string>()
  const wantedMlbamIds = new Set<number>()
  const wantedOttoneuIds = new Set<number>()
  for (const u of unlinked) {
    if (u.fangraphsId) wantedFgIds.add(u.fangraphsId)
    if (u.mlbamId !== null) wantedMlbamIds.add(u.mlbamId)
  }
  for (const o of manualOverrides) {
    if (o.fangraphsId) wantedFgIds.add(o.fangraphsId)
    if (o.mlbamId !== null) wantedMlbamIds.add(o.mlbamId)
    if (o.ottoneuId !== null) wantedOttoneuIds.add(o.ottoneuId)
  }

  const candidateOr = [
    ...(wantedFgIds.size > 0
      ? [{ fangraphsId: { in: [...wantedFgIds] } }]
      : []),
    ...(wantedMlbamIds.size > 0
      ? [{ mlbamId: { in: [...wantedMlbamIds] } }]
      : []),
    ...(wantedOttoneuIds.size > 0
      ? [{ ottoneuId: { in: [...wantedOttoneuIds] } }]
      : []),
  ]

  // Nothing to link — and an empty OR would match every Player, the same trap
  // guarded against in mergeSyntheticPlayers.
  const candidates =
    candidateOr.length === 0
      ? []
      : await prisma.player.findMany({
          where: { deletedAt: null, OR: candidateOr },
          select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
        })

  const byFgId = new Map<string, (typeof candidates)[0]>()
  const byMlbamId = new Map<number, (typeof candidates)[0]>()
  const byOttoneuId = new Map<number, (typeof candidates)[0]>()
  for (const p of candidates) {
    if (p.fangraphsId !== null) byFgId.set(p.fangraphsId, p)
    if (p.mlbamId !== null) byMlbamId.set(p.mlbamId, p)
    if (p.ottoneuId !== null) byOttoneuId.set(p.ottoneuId, p)
  }

  // ── Match unlinked universe rows to Players ───────────────────────────────
  const universeLinks: { id: string; playerId: string }[] = []
  const ottoneuFills: { id: string; ottoneuId: number }[] = []
  const filledPlayerIds = new Set<string>()

  for (const u of unlinked) {
    let player: (typeof candidates)[0] | undefined

    // 1. FG ID — direct string match (covers numeric and "sa…" minor-league IDs)
    if (u.fangraphsId) player = byFgId.get(u.fangraphsId)
    // 2. MLBAM ID fallback
    if (!player && u.mlbamId !== null) player = byMlbamId.get(u.mlbamId)

    if (!player) continue

    universeLinks.push({ id: u.id, playerId: player.id })

    if (player.ottoneuId === null && !filledPlayerIds.has(player.id)) {
      ottoneuFills.push({ id: player.id, ottoneuId: u.ottoneuId })
      filledPlayerIds.add(player.id)
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
  })
  for (const p of linkedWithoutOttoneuId) {
    const oid = p.universe?.[0]?.ottoneuId
    if (oid !== undefined && !filledPlayerIds.has(p.id)) {
      ottoneuFills.push({ id: p.id, ottoneuId: oid })
      filledPlayerIds.add(p.id)
    }
  }

  // ── Commit in batches ─────────────────────────────────────────────────────
  for (const batch of chunk(universeLinks, 500)) {
    await prisma.$transaction(
      batch.map((u) =>
        prisma.playerUniverse.update({
          where: { id: u.id },
          data: { playerId: u.playerId },
        }),
      ),
    )
  }
  for (const batch of chunk(ottoneuFills, 500)) {
    await prisma.$transaction(
      batch.map((p) =>
        prisma.player.update({
          where: { id: p.id },
          data: { ottoneuId: p.ottoneuId },
        }),
      ),
    )
  }

  // ── Auto-link manual overrides to canonical Players ──────────────────────
  const overrideLinks: { id: string; playerId: string }[] = []
  for (const o of manualOverrides) {
    let player: (typeof candidates)[0] | undefined
    if (o.fangraphsId) player = byFgId.get(o.fangraphsId)
    if (!player && o.mlbamId !== null) player = byMlbamId.get(o.mlbamId)
    if (!player && o.ottoneuId !== null) player = byOttoneuId.get(o.ottoneuId)
    if (player) overrideLinks.push({ id: o.id, playerId: player.id })
  }

  for (const batch of chunk(overrideLinks, 500)) {
    await prisma.$transaction(
      batch.map((o) =>
        prisma.playerOverride.update({
          where: { id: o.id },
          data: { playerId: o.playerId },
        }),
      ),
    )
  }

  return {
    linked: universeLinks.length,
    ottoneuIdsFilled: ottoneuFills.length,
    manualOverridesLinked: overrideLinks.length,
    manualPlayersMerged,
  }
}
