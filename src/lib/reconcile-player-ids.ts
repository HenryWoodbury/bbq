import { chunk } from "@/lib/csv"
import {
  EXCLUDE_MANUAL_PLAYERS,
  ONLY_MANUAL_PLAYERS,
} from "@/lib/manual-players"
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
  await prisma.$transaction(async (tx) => {
    // PlayerStat carries a compound unique key that includes playerId, so rows
    // the real player already has cannot be repointed onto it — the real
    // player's own stats win and the synthetic duplicates are dropped.
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
        select: { id: true, ...keySelect },
      }),
      tx.playerStat.findMany({
        where: { playerId: realId },
        select: keySelect,
      }),
    ])
    const taken = new Set(realStats.map(statKey))
    const movable = syntheticStats.filter((s) => !taken.has(statKey(s)))
    const duplicates = syntheticStats.filter((s) => taken.has(statKey(s)))

    if (movable.length > 0) {
      await tx.playerStat.updateMany({
        where: { id: { in: movable.map((s) => s.id) } },
        data: { playerId: realId },
      })
    }
    if (duplicates.length > 0) {
      await tx.playerStat.deleteMany({
        where: { id: { in: duplicates.map((s) => s.id) } },
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
    const [syntheticOverride, realOverride] = await Promise.all([
      tx.playerOverride.findUnique({ where: { playerId: syntheticId } }),
      tx.playerOverride.findUnique({ where: { playerId: realId } }),
    ])

    if (syntheticOverride) {
      if (!realOverride) {
        await tx.playerOverride.update({
          where: { id: syntheticOverride.id },
          data: { playerId: realId },
        })
      } else {
        const fill = <T>(current: T | null, incoming: T | null): T | null =>
          current ?? incoming
        await tx.playerOverride.update({
          where: { id: realOverride.id },
          data: {
            isManual: true,
            displayName: fill(
              realOverride.displayName,
              syntheticOverride.displayName,
            ),
            firstName: fill(
              realOverride.firstName,
              syntheticOverride.firstName,
            ),
            lastName: fill(realOverride.lastName, syntheticOverride.lastName),
            nickname: fill(realOverride.nickname, syntheticOverride.nickname),
            birthday: fill(realOverride.birthday, syntheticOverride.birthday),
            team: fill(realOverride.team, syntheticOverride.team),
            mlbLevel: fill(realOverride.mlbLevel, syntheticOverride.mlbLevel),
            league: fill(realOverride.league, syntheticOverride.league),
            active: fill(realOverride.active, syntheticOverride.active),
            bats: fill(realOverride.bats, syntheticOverride.bats),
            throws: fill(realOverride.throws, syntheticOverride.throws),
            positions:
              realOverride.positions.length > 0
                ? realOverride.positions
                : syntheticOverride.positions,
            fangraphsId: fill(
              realOverride.fangraphsId,
              syntheticOverride.fangraphsId,
            ),
            mlbamId: fill(realOverride.mlbamId, syntheticOverride.mlbamId),
            ottoneuId: fill(
              realOverride.ottoneuId,
              syntheticOverride.ottoneuId,
            ),
            deletedAt: null,
          },
        })
        await tx.playerOverride.delete({ where: { id: syntheticOverride.id } })
      }
    }

    await tx.player.update({
      where: { id: syntheticId },
      data: { deletedAt: new Date() },
    })
  })
}

/** Matches synthetic manual Players against real SFBB Players on FG/MLBAM id
 *  and merges each pair. Returns the number merged. */
async function mergeSyntheticPlayers(): Promise<number> {
  const synthetic = await prisma.player.findMany({
    where: { ...ONLY_MANUAL_PLAYERS, deletedAt: null },
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
    where: {
      deletedAt: null,
      ...EXCLUDE_MANUAL_PLAYERS,
      OR: [
        ...(fgIds.length > 0 ? [{ fangraphsId: { in: fgIds } }] : []),
        ...(mlbamIds.length > 0 ? [{ mlbamId: { in: mlbamIds } }] : []),
      ],
    },
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

  // ── Fetch unlinked universe rows ──────────────────────────────────────────
  const unlinked = await prisma.playerUniverse.findMany({
    where: { format: "ottoneu", deletedAt: null, playerId: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  })

  // ── Build lookup maps from all non-deleted Players ────────────────────────
  const allPlayers = await prisma.player.findMany({
    where: { deletedAt: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  })

  const byFgId = new Map<string, (typeof allPlayers)[0]>()
  const byMlbamId = new Map<number, (typeof allPlayers)[0]>()
  const byOttoneuId = new Map<number, (typeof allPlayers)[0]>()
  for (const p of allPlayers) {
    if (p.fangraphsId !== null) byFgId.set(p.fangraphsId, p)
    if (p.mlbamId !== null) byMlbamId.set(p.mlbamId, p)
    if (p.ottoneuId !== null) byOttoneuId.set(p.ottoneuId, p)
  }

  // ── Match unlinked universe rows to Players ───────────────────────────────
  const universeLinks: { id: string; playerId: string }[] = []
  const ottoneuFills: { id: string; ottoneuId: number }[] = []
  const filledPlayerIds = new Set<string>()

  for (const u of unlinked) {
    let player: (typeof allPlayers)[0] | undefined

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
  const manualOverrides = await prisma.playerOverride.findMany({
    where: { isManual: true, playerId: null, deletedAt: null },
    select: { id: true, fangraphsId: true, mlbamId: true, ottoneuId: true },
  })

  const overrideLinks: { id: string; playerId: string }[] = []
  for (const o of manualOverrides) {
    let player: (typeof allPlayers)[0] | undefined
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
