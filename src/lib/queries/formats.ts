import {
  FormatDraftMode,
  FormatDraftType,
  FormatPlatform,
  FormatPlayType,
  FormatScoring,
} from "@/generated/prisma/client"

// Typed tuples so z.enum() infers the Prisma enum type (not string)
export const FORMAT_PLATFORM_VALUES = Object.values(FormatPlatform) as unknown as [FormatPlatform, ...FormatPlatform[]]
export const FORMAT_PLAY_TYPE_VALUES = Object.values(FormatPlayType) as unknown as [FormatPlayType, ...FormatPlayType[]]
export const FORMAT_SCORING_VALUES = Object.values(FormatScoring) as unknown as [FormatScoring, ...FormatScoring[]]
export const FORMAT_DRAFT_MODE_VALUES = Object.values(FormatDraftMode) as unknown as [FormatDraftMode, ...FormatDraftMode[]]
export const FORMAT_DRAFT_TYPE_VALUES = Object.values(FormatDraftType) as unknown as [FormatDraftType, ...FormatDraftType[]]

export const formatSelect = {
  name: true,
  platform: true,
  playType: true,
  scoring: true,
  draftType: true,
  cap: true,
  rosters: true,
  rosterSize: true,
} as const

export const adminFormatSelect = {
  id: true,
  name: true,
  platform: true,
  playType: true,
  scoring: true,
  draftMode: true,
  draftType: true,
  teams: true,
  rosterSize: true,
  cap: true,
  rosters: true,
  isActive: true,
  version: true,
  description: true,
  rulesText: true,
} as const

const SCORING_LABELS: Record<string, string> = {
  FiveX5: "5×5",
  FourX4: "4×4",
  Fangraphs: "FGPTs",
  SABR: "SABR",
  Points: "Points",
}

export function scoringLabel(scoring: string | undefined): string {
  return (scoring && SCORING_LABELS[scoring]) ?? "—"
}
