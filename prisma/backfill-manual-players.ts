/**
 * Backfill: mint a canonical Player row for every manually-added PlayerOverride
 * that has none.
 *
 * Manual adds originally created only a PlayerOverride with playerId = null.
 * Because PlayerStat.playerId is a required FK to Player, those players could
 * never hold projections and were invisible to the stats views and every export
 * (Batcast included). This gives each one a synthetic Player so stat uploads can
 * link to it, then reconciles ids so the matching PlayerUniverse row attaches
 * (exports read positions from universe).
 *
 * Idempotent — overrides that already have a playerId are skipped.
 *
 * Run: pnpm db:backfill-manual
 */
import "dotenv/config"
import {
  buildManualPlayerData,
  manualPlayerName,
} from "../src/lib/manual-players"
import { prisma } from "../src/lib/prisma"
import { reconcilePlayerIds } from "../src/lib/reconcile-player-ids"

async function main() {
  const orphans = await prisma.playerOverride.findMany({
    where: { isManual: true, playerId: null, deletedAt: null },
    select: {
      id: true,
      displayName: true,
      firstName: true,
      lastName: true,
      birthday: true,
      team: true,
      mlbLevel: true,
      active: true,
      bats: true,
      throws: true,
      positions: true,
      fangraphsId: true,
      mlbamId: true,
      ottoneuId: true,
    },
  })

  console.log(
    `Found ${orphans.length} manual override(s) without a Player row.`,
  )

  for (const o of orphans) {
    const name = manualPlayerName(o)
    await prisma.$transaction(async (tx) => {
      const player = await tx.player.create({
        data: buildManualPlayerData(o),
        select: { id: true },
      })
      await tx.playerOverride.update({
        where: { id: o.id },
        data: { playerId: player.id },
      })
      console.log(`  linked ${name} → Player ${player.id}`)
    })
  }

  const result = await reconcilePlayerIds()
  console.log("Reconcile:", result)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
