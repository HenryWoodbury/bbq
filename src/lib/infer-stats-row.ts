export type PlayerType = "BATTER" | "PITCHER"
export type StatType = "actual" | "projected"
export type Projection =
  | "None"
  | "ATC"
  | "DepthCharts"
  | "OOPSY"
  | "Steamer"
  | "TheBat"
  | "TheBatX"
  | "ZiPS"
  | "ZiPSDC"
export type Split = "none" | "neutral" | "vs_left" | "vs_right"

export type PendingRow = {
  id: string
  file: File
  season: number
  playerType: PlayerType
  statType: StatType
  projection: Projection
  split: Split
  saving: boolean
  error: string | null
}

export function inferStatsRow(file: File, currentYear: number): PendingRow {
  const name = file.name.toLowerCase()

  const playerType = /pitcher|pitching/.test(name) ? "PITCHER" : "BATTER"

  const yearMatch = name.match(/20\d{2}/)
  const season = yearMatch ? parseInt(yearMatch[0], 10) : currentYear

  let projection: PendingRow["projection"] = "None"
  if (/thebatx|bat.?x/.test(name)) projection = "TheBatX"
  else if (/thebat/.test(name)) projection = "TheBat"
  else if (/steamer/.test(name)) projection = "Steamer"
  else if (/zips.?dc/.test(name)) projection = "ZiPSDC"
  else if (/zips/.test(name)) projection = "ZiPS"
  else if (/depthcharts|depth.?charts/.test(name)) projection = "DepthCharts"
  else if (/(?<![a-z])atc(?![a-z])/.test(name)) projection = "ATC"
  else if (/oopsy/.test(name)) projection = "OOPSY"

  let split: PendingRow["split"] = "none"
  if (/vs?[\s_]?l(?:eft|h[bph]?)?(?![a-z])|(?<![a-z])lh[bp]/.test(name)) split = "vs_left"
  else if (/vs?[\s_]?r(?:ight|h[bph]?)?(?![a-z])|(?<![a-z])rh[bp]/.test(name)) split = "vs_right"
  else if (/neutral/.test(name)) split = "neutral"

  const statType: StatType = projection !== "None" || split !== "none" ? "projected" : "actual"

  return {
    id: crypto.randomUUID(),
    file,
    season,
    playerType,
    statType,
    projection,
    split,
    saving: false,
    error: null,
  }
}
