import { randomUUID } from "node:crypto"

/**
 * Prefix marking a Player row minted by the manual-add flow rather than sourced
 * from the SFBB Player ID Map.
 *
 * Manually-added players need a canonical Player row because PlayerStat,
 * RosterHistory and PlayerUniverse all hang off Player.id — an override alone
 * cannot carry stats and is therefore invisible to the stats views and exports.
 * Player.sfbbId is required and unique, so synthetic players get a namespaced
 * id that keeps them distinguishable from real SFBB rows.
 *
 * Two consequences depend on this prefix:
 *   1. The sync's replace-mode sweep must not soft-delete synthetic players
 *      (they are absent from the SFBB CSV by definition).
 *   2. Synthetic players are merge candidates — once SFBB publishes the player,
 *      reconcilePlayerIds folds the synthetic row into the real one.
 */
export const MANUAL_SFBB_PREFIX = "manual:"

export function isManualSfbbId(sfbbId: string): boolean {
  return sfbbId.startsWith(MANUAL_SFBB_PREFIX)
}

export function newManualSfbbId(): string {
  return `${MANUAL_SFBB_PREFIX}${randomUUID()}`
}

/** Player.playerName is required, so derive it from whichever name fields the
 *  caller supplied. Callers validate that at least one is present. */
export function manualPlayerName(input: {
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
}): string {
  const full = [input.firstName, input.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ")
  return input.displayName?.trim() || full || "Unnamed Player"
}

/** Prisma `where` fragment excluding synthetic manual players. Spread it into
 *  any bulk `Player` query that treats the SFBB map as the source of truth —
 *  notably the replace-mode sweeps, which would otherwise delete them. */
export const EXCLUDE_MANUAL_PLAYERS = {
  NOT: { sfbbId: { startsWith: MANUAL_SFBB_PREFIX } },
} as const

/** Prisma `where` fragment selecting only synthetic manual players. */
export const ONLY_MANUAL_PLAYERS = {
  sfbbId: { startsWith: MANUAL_SFBB_PREFIX },
} as const

export type ManualPlayerInput = {
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  birthday?: Date | null
  team?: string | null
  mlbLevel?: string | null
  active?: boolean | null
  bats?: string | null
  throws?: string | null
  positions?: string[]
  fangraphsId?: string | null
  mlbamId?: number | null
  ottoneuId?: number | null
}

/**
 * Builds the `Player.create` payload for a manually-added player.
 *
 * Shared by the manual-add route and the backfill script so the two cannot
 * drift — in particular the synthetic `sfbbId` and the `active` default, which
 * decides whether the player survives the export's active filter.
 */
export function buildManualPlayerData(input: ManualPlayerInput) {
  return {
    sfbbId: newManualSfbbId(),
    playerName: manualPlayerName(input),
    fgSpecialChar: input.displayName ?? null,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    positions: input.positions ?? [],
    team: input.team ?? null,
    mlbLevel: input.mlbLevel ?? null,
    active: input.active ?? true,
    birthday: input.birthday ?? null,
    bats: input.bats ?? null,
    throws: input.throws ?? null,
    fangraphsId: input.fangraphsId ?? null,
    mlbamId: input.mlbamId ?? null,
    ottoneuId: input.ottoneuId ?? null,
  }
}
