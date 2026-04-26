// Display labels and option lists for stat enums — no Prisma dependency, safe for client components.

export const PROJECTION_OPTIONS: { value: string; label: string }[] = [
  { value: "ATC", label: "ATC" },
  { value: "DepthCharts", label: "Depth Charts" },
  { value: "OOPSY", label: "OOPSY" },
  { value: "Steamer", label: "Steamer" },
  { value: "TheBat", label: "The Bat" },
  { value: "TheBatX", label: "The Bat X" },
  { value: "ZiPS", label: "ZiPS" },
  { value: "ZiPSDC", label: "ZiPS DC" },
]

// PendingRow (upload form) uses snake_case splits; Prisma stores PascalCase enum values.
// This map normalizes form values to Prisma format for cross-system key comparisons.
export const SPLIT_NORM: Record<string, string> = {
  none: "None",
  neutral: "Neutral",
  vs_left: "VsLeft",
  vs_right: "VsRight",
}

// Snake-case values — used in PendingRow (upload form)
export const SPLIT_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "neutral", label: "Neutral" },
  { value: "vs_left", label: "vs Left" },
  { value: "vs_right", label: "vs Right" },
]

// Prisma enum name values — used in StatsFilter (player table filter)
export const SPLIT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "None", label: "None" },
  { value: "Neutral", label: "Neutral" },
  { value: "VsLeft", label: "vs Left" },
  { value: "VsRight", label: "vs Right" },
]

export const PROJECTION_DISPLAY: Record<string, string> = {
  None: "–",
  ATC: "ATC",
  DepthCharts: "Depth Charts",
  OOPSY: "OOPSY",
  Steamer: "Steamer",
  TheBat: "The Bat",
  TheBatX: "The Bat X",
  ZiPS: "ZiPS",
  ZiPSDC: "ZiPS DC",
}

export const SPLIT_DISPLAY: Record<string, string> = {
  None: "—",
  Neutral: "Neutral",
  VsLeft: "vs Left",
  VsRight: "vs Right",
  none: "—",
  neutral: "Neutral",
  vs_left: "vs Left",
  vs_right: "vs Right",
}
