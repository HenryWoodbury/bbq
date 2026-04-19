import { StatProjection, StatSplit } from "@/generated/prisma/client"

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

