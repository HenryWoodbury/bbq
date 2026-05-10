import { csvEscape } from "./csv"
import { SAVANT_TEAM_TO_ABBREV } from "./team-codes"

export type ParkFactorRow = {
  venueName: string
  teamName: string | null
  season: number
  batSide: string
  rolling: number
  factors: Record<string, number>
}

export type DisplayRow = ParkFactorRow & { rank: number }

const FACTOR_W = 64
const PA_W = 84

export const FACTOR_COLS: Array<{ key: string; header: string; size: number }> = [
  { key: "index_woba", header: "PF", size: FACTOR_W },
  { key: "index_wobacon", header: "wOBAcon", size: FACTOR_W },
  { key: "index_xwobacon", header: "xwOBAcon", size: FACTOR_W },
  { key: "index_bacon", header: "BACON", size: FACTOR_W },
  { key: "index_xbacon", header: "xBACON", size: FACTOR_W },
  { key: "index_hardhit", header: "HardHit", size: FACTOR_W },
  { key: "index_runs", header: "R", size: FACTOR_W },
  { key: "index_obp", header: "OBP", size: FACTOR_W },
  { key: "index_hits", header: "H", size: FACTOR_W },
  { key: "index_1b", header: "1B", size: FACTOR_W },
  { key: "index_2b", header: "2B", size: FACTOR_W },
  { key: "index_3b", header: "3B", size: FACTOR_W },
  { key: "index_hr", header: "HR", size: FACTOR_W },
  { key: "index_bb", header: "BB", size: FACTOR_W },
  { key: "index_so", header: "SO", size: FACTOR_W },
  { key: "pa", header: "PA", size: PA_W },
]

export const FACTOR_COL_IDS = new Set(FACTOR_COLS.map((c) => c.key))

const CSV_COL_HEADER: Record<string, string> = {
  index_woba: "Park Factor",
}

export function addRanks(rows: ParkFactorRow[]): DisplayRow[] {
  const sorted = [...rows].sort(
    (a, b) => (b.factors.index_woba ?? 0) - (a.factors.index_woba ?? 0),
  )
  const rankMap = new Map(sorted.map((row, i) => [row, i + 1]))
  return rows.map((row) => ({ ...row, rank: rankMap.get(row) ?? 0 }))
}

export function csvYearDisplay(season: number, rolling: number): string {
  if (rolling === 1) return season.toString()
  return `${season - (rolling - 1)}-${String(season).slice(-2)}`
}

// For any venue absent from the target rolling window, fill from the longest
// shorter window available (e.g. Athletics in 2025–26 when 3yr selected).
export function applyFallback(
  seasonSideRows: ParkFactorRow[],
  targetRolling: number,
): ParkFactorRow[] {
  const primary = seasonSideRows.filter((r) => r.rolling === targetRolling)
  const covered = new Set(primary.map((r) => r.venueName))
  const fallback: ParkFactorRow[] = []
  for (let fb = targetRolling - 1; fb >= 1; fb--) {
    for (const row of seasonSideRows) {
      if (row.rolling === fb && !covered.has(row.venueName)) {
        fallback.push(row)
        covered.add(row.venueName)
      }
    }
  }
  return [...primary, ...fallback]
}

export function toCsv(rows: DisplayRow[]): string {
  if (rows.length === 0) return ""
  const headers = [
    "Abbr",
    "Team",
    "Venue",
    "Year",
    ...FACTOR_COLS.map((c) => CSV_COL_HEADER[c.key] ?? c.header),
  ]
  const lines = [headers.join(",")]
  for (const row of rows) {
    const abbr = row.teamName ? (SAVANT_TEAM_TO_ABBREV[row.teamName] ?? "") : ""
    lines.push(
      [
        abbr,
        csvEscape(row.teamName),
        csvEscape(row.venueName),
        csvYearDisplay(row.season, row.rolling),
        ...FACTOR_COLS.map((c) => row.factors[c.key] ?? ""),
      ].join(","),
    )
  }
  return lines.join("\n")
}
