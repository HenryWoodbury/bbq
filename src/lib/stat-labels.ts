// Display labels for stat enums — no Prisma dependency, safe for client components.

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
  None: "None",
  Neutral: "Neutral",
  VsLeft: "vs Left",
  VsRight: "vs Right",
}
