export const AL_TEAM_CODES = [
  "BAL", "BOS", "NYY", "TBR", "TOR",
  "CHW", "CLE", "DET", "KCR", "MIN",
  "HOU", "LAA", "ATH", "SEA", "TEX",
]

export const NL_TEAM_CODES = [
  "ATL", "CHC", "CIN", "MIL", "NYM",
  "PHI", "PIT", "STL", "ARI", "COL",
  "LAD", "SDP", "SFG", "MIA", "WAS",
]

// Maps non-SFBB abbreviations to canonical SFBB equivalents.
// Extend here if new mismatches are discovered.
export const FOREIGN_TEAM_MAP: Record<string, string> = {
  WSN: "WAS", // Fangraphs/Ottoneu
  WSH: "WAS", // occasional SFBB data error
}

/** Trims whitespace and converts foreign team codes to canonical SFBB equivalents. */
export function normalizeTeamCode(code: string | null): string | null {
  if (!code) return code
  const trimmed = code.trim()
  return FOREIGN_TEAM_MAP[trimmed] ?? trimmed
}

const AL_TEAMS = new Set(AL_TEAM_CODES)
const NL_TEAMS = new Set(NL_TEAM_CODES)

export function deriveLeagueFromTeam(team: string | null): "AL" | "NL" | null {
  if (!team) return null
  if (AL_TEAMS.has(team)) return "AL"
  if (NL_TEAMS.has(team)) return "NL"
  return null
}

export function deriveLevelFromFgId(fangraphsId: string | null): string {
  if (!fangraphsId) return ""
  return fangraphsId.startsWith("sa") ? "MiLB" : "MLB"
}
