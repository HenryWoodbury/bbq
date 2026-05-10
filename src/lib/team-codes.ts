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

// Maps Baseball Savant name_display_club values to canonical SFBB abbreviations.
// Includes historical variants (e.g. pre-2022 Cleveland, pre-move Oakland).
export const SAVANT_TEAM_TO_ABBREV: Record<string, string> = {
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CHW",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Cleveland Indians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KCR",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  "Athletics": "ATH",
  "Oakland Athletics": "ATH",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SDP",
  "San Francisco Giants": "SFG",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TBR",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WAS",
}

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
