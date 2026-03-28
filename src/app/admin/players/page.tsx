import type { PlayerRow } from "@/components/players-table"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { PlayersSync } from "./players-sync"
import { PlayersTableAdmin } from "./players-table-admin"

export const metadata = { title: "Manage Players — BBQ" }

export type SyncStatus = {
  lastSyncedPlayer: {
    updatedAt: Date
  } | null
  lastUploadedUniverse: {
    updatedAt: Date
  } | null
  lastUploadedStats: {
    updatedAt: Date
  } | null
}

export default async function AdminPlayersPage() {
  await requireAdmin()

  const [
    lastSyncedPlayer,
    lastUploadedUniverse,
    lastUploadedStats,
    players,
    manualOverrides,
  ] = await Promise.all([
    prisma.player.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.playerUniverse.findFirst({
      where: { format: "ottoneu", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.playerStat.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.player.findMany({
      where: { deletedAt: null },
      orderBy: { playerName: "asc" },
      select: {
        id: true,
        ottoneuId: true,
        playerName: true,
        fgSpecialChar: true,
        firstName: true,
        lastName: true,
        active: true,
        birthday: true,
        team: true,
        mlbLevel: true,
        fangraphsId: true,
        bats: true,
        throws: true,
        universe: {
          where: { format: "ottoneu", deletedAt: null },
          select: { positions: true, fangraphsId: true },
          take: 1,
        },
        override: {
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
            deletedAt: true,
          },
        },
      },
    }),
    // Manual overrides not yet linked to a Player
    prisma.playerOverride.findMany({
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
        fangraphsId: true,
        ottoneuId: true,
      },
    }),
  ])

  const playerRows: PlayerRow[] = players.map((p) => {
    const ov = p.override?.deletedAt ? null : p.override
    return {
      id: p.id,
      ottoneuId: p.ottoneuId,
      // Display name: override.displayName > fgSpecialChar > playerName
      playerName: p.playerName,
      fgSpecialChar: ov?.displayName ?? p.fgSpecialChar,
      firstName: ov?.firstName ?? p.firstName,
      lastName: ov?.lastName ?? p.lastName,
      active: ov?.active ?? p.active,
      birthday:
        (ov?.birthday ?? p.birthday)?.toISOString().slice(0, 10) ?? null,
      team: ov?.team ?? p.team,
      mlbLevel: ov?.mlbLevel ?? p.mlbLevel,
      fangraphsId: p.fangraphsId,
      bats: ov?.bats ?? p.bats,
      throws: ov?.throws ?? p.throws,
      ottoneuPositions: p.universe[0]?.positions ?? [],
      universeFgId: p.universe[0]?.fangraphsId ?? null,
      overrideId: ov?.id ?? null,
      isManual: false,
    }
  })

  // Build rows for manual overrides that haven't been auto-linked yet
  const manualRows: PlayerRow[] = manualOverrides.map((o) => ({
    id: o.id, // use override id as row id since there's no player record
    ottoneuId: o.ottoneuId,
    playerName:
      o.displayName ??
      [o.firstName, o.lastName].filter(Boolean).join(" ") ??
      "",
    fgSpecialChar: o.displayName,
    firstName: o.firstName,
    lastName: o.lastName,
    active: o.active ?? true,
    birthday: o.birthday?.toISOString().slice(0, 10) ?? null,
    team: o.team,
    mlbLevel: o.mlbLevel,
    fangraphsId: o.fangraphsId,
    bats: o.bats,
    throws: o.throws,
    ottoneuPositions: [],
    universeFgId: null,
    overrideId: o.id,
    isManual: true,
  }))

  const allRows = [...playerRows, ...manualRows]

  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Players</h1>
      <section>
        <PlayersSync
          status={{
            lastSyncedPlayer,
            lastUploadedUniverse,
            lastUploadedStats,
          }}
        />
      </section>
      <section>
        <PlayersTableAdmin data={allRows} />
      </section>
    </div>
  )
}
