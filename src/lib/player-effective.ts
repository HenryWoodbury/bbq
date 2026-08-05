import { deriveLeagueFromTeam, isMiLBFangraphsId } from "@/lib/team-codes"

/**
 * Override precedence for player attributes, in one place.
 *
 * A `PlayerOverride` wins only when it is live (`deletedAt === null`) and
 * actually sets the field; otherwise the canonical `Player` value stands. Every
 * consumer that displays *or filters* players must apply this same rule —
 * resolving it for display but filtering on the raw `Player` column silently
 * drops rows the user can see, and keeps rows they cannot.
 *
 * Note `PlayerOverride.fangraphsId` / `mlbamId` / `ottoneuId` are dedup keys for
 * sync, not display overrides, so they are deliberately absent here.
 */

export type PlayerAttributeFields = {
  playerName: string
  fgSpecialChar: string | null
  team: string | null
  mlbLevel: string | null
  active: boolean
  birthday: Date | null
  bats: string | null
  throws: string | null
}

export type PlayerOverrideFields = {
  deletedAt: Date | null
  displayName: string | null
  team: string | null
  mlbLevel: string | null
  league: string | null
  active: boolean | null
  birthday: Date | null
  bats: string | null
  throws: string | null
}

export type EffectivePlayer = {
  displayName: string
  team: string | null
  mlbLevel: string | null
  /** `"AL"` / `"NL"`, from the override if set, else derived from the team. */
  league: string | null
  active: boolean
  birthday: Date | null
  bats: string | null
  throws: string | null
}

/** Returns the override only when it applies — null when absent or soft-deleted. */
export function liveOverride<T extends { deletedAt: Date | null }>(
  override: T | null | undefined,
): T | null {
  return override && override.deletedAt === null ? override : null
}

export function effectivePlayer(
  player: PlayerAttributeFields,
  override: PlayerOverrideFields | null | undefined,
): EffectivePlayer {
  const ov = liveOverride(override)
  const team = ov?.team ?? player.team
  return {
    displayName: ov?.displayName ?? player.fgSpecialChar ?? player.playerName,
    team,
    mlbLevel: ov?.mlbLevel ?? player.mlbLevel,
    league: ov?.league ?? deriveLeagueFromTeam(team),
    active: ov?.active ?? player.active,
    birthday: ov?.birthday ?? player.birthday,
    bats: ov?.bats ?? player.bats,
    throws: ov?.throws ?? player.throws,
  }
}

export type ActiveFilter = "all" | "yes" | "no"
export type LeagueFilter = "all" | "mlb" | "milb" | "al" | "nl"

/**
 * Applies the active and league filters to a player's effective attributes.
 * `fangraphsId` is not overridable, so the level split reads it directly.
 */
export function matchesPlayerFilters(
  effective: Pick<EffectivePlayer, "active" | "league">,
  fangraphsId: string | null,
  filters: { active: ActiveFilter; league: LeagueFilter },
): boolean {
  if (filters.active === "yes" && !effective.active) return false
  if (filters.active === "no" && effective.active) return false

  switch (filters.league) {
    case "milb":
      return isMiLBFangraphsId(fangraphsId)
    case "mlb":
      return fangraphsId !== null && !isMiLBFangraphsId(fangraphsId)
    case "al":
      return effective.league === "AL"
    case "nl":
      return effective.league === "NL"
    default:
      return true
  }
}
