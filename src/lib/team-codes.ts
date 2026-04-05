export const AL_TEAM_CODES = [
  "BAL",
  "BOS",
  "NYY",
  "TBR",
  "TOR",
  "CWS",
  "CLE",
  "DET",
  "KCR",
  "MIN",
  "HOU",
  "LAA",
  "OAK",
  "SEA",
  "TEX",
]

export const NL_TEAM_CODES = [
  "ATL",
  "CHC",
  "CIN",
  "MIL",
  "NYM",
  "PHI",
  "PIT",
  "STL",
  "ARI",
  "COL",
  "LAD",
  "SDP",
  "SFG",
  "MIA",
  "WSN",
]

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
