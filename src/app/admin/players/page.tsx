import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { SyncPlayers } from "../sync-players";
import { UploadPlayerUniverse } from "../upload-player-universe";
import { PlayersTableAdmin } from "./players-table-admin";
import { type PlayerRow } from "@/components/players-table";

export const metadata = { title: "Manage Players — BBQ" };

export default async function AdminPlayersPage() {
  await requireAdmin();

  const [lastSyncedPlayer, lastUploadedUniverse, players, manualOverrides] = await Promise.all([
    prisma.player.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    prisma.playerUniverse.findFirst({
      where: { format: "ottoneu", deletedAt: null },
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
  ]);

  const playerRows: PlayerRow[] = players.map((p) => {
    const ov = p.override?.deletedAt ? null : p.override;
    return {
      id: p.id,
      ottoneuId: p.ottoneuId,
      // Display name: override.displayName > fgSpecialChar > playerName
      playerName: p.playerName,
      fgSpecialChar: ov?.displayName ?? p.fgSpecialChar,
      firstName: ov?.firstName ?? p.firstName,
      lastName: ov?.lastName ?? p.lastName,
      active: ov?.active ?? p.active,
      birthday: (ov?.birthday ?? p.birthday)?.toISOString().slice(0, 10) ?? null,
      team: ov?.team ?? p.team,
      mlbLevel: ov?.mlbLevel ?? p.mlbLevel,
      fangraphsId: p.fangraphsId,
      bats: ov?.bats ?? p.bats,
      throws: ov?.throws ?? p.throws,
      ottoneuPositions: p.universe[0]?.positions ?? [],
      universeFgId: p.universe[0]?.fangraphsId ?? null,
      overrideId: ov?.id ?? null,
      isManual: false,
    };
  });

  // Build rows for manual overrides that haven't been auto-linked yet
  const manualRows: PlayerRow[] = manualOverrides.map((o) => ({
    id: o.id, // use override id as row id since there's no player record
    ottoneuId: o.ottoneuId,
    playerName: o.displayName ?? [o.firstName, o.lastName].filter(Boolean).join(" ") ?? "",
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
  }));

  const allRows = [...playerRows, ...manualRows];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Manage Players
        </h1>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Sync Player IDs
        </h2>
        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
          Fetches the Smart Fantasy Baseball Player ID Map and upserts all players.
        </p>
        <SyncPlayers lastSyncedAt={lastSyncedPlayer?.updatedAt ?? null} />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Import the Ottoneu Player Universe
        </h2>
        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
          Upload the full list of players in the format and their positions.
        </p>
        <UploadPlayerUniverse lastUploadedAt={lastUploadedUniverse?.updatedAt ?? null} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Players
        </h2>
        <PlayersTableAdmin data={allRows} />
      </section>
    </div>
  );
}
