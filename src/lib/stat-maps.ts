import { StatProjection } from "@/generated/prisma/client"

export const PROJECTION_MAP: Record<string, StatProjection> = {
  None: StatProjection.None,
  ZiPS: StatProjection.ZiPS,
  Steamer: StatProjection.Steamer,
  ATC: StatProjection.ATC,
  TheBat: StatProjection.TheBat,
  TheBatX: StatProjection.TheBatX,
  OOPSY: StatProjection.OOPSY,
}
