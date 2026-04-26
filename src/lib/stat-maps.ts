import { StatProjection, StatSplit } from "@/generated/prisma/client"

export function deduplicatePitcherSplits<T extends { playerId: string; split: StatSplit }>(rows: T[]): T[] {
  const map = new Map<string, T>()
  for (const r of rows) {
    if (!map.has(r.playerId) || r.split === StatSplit.Neutral) map.set(r.playerId, r)
  }
  return [...map.values()]
}

export const PROJECTION_MAP: Record<string, StatProjection> = {
  None: StatProjection.None,
  ZiPS: StatProjection.ZiPS,
  Steamer: StatProjection.Steamer,
  ATC: StatProjection.ATC,
  TheBat: StatProjection.TheBat,
  TheBatX: StatProjection.TheBatX,
  OOPSY: StatProjection.OOPSY,
  DepthCharts: StatProjection.DepthCharts,
  ZiPSDC: StatProjection.ZiPSDC,
  RoS: StatProjection.RoS,
}

export const SPLIT_MAP: Record<string, StatSplit> = {
  None: StatSplit.None,
  Neutral: StatSplit.Neutral,
  VsLeft: StatSplit.VsLeft,
  VsRight: StatSplit.VsRight,
}

