import { formatHex, oklch as toOklchCulori, parseHex } from "culori"
import type { OklchColorData } from "./heat-map"

export function hexToOklch(hex: string): OklchColorData | null {
  const parsed = parseHex(hex)
  if (!parsed) return null
  const c = toOklchCulori(parsed)
  if (!c) return null
  return { lightness: c.l, chroma: c.c, hue: c.h ?? 0, alpha: c.alpha ?? 1 }
}

export function oklchToHex(color: OklchColorData): string {
  return formatHex({ mode: "oklch", l: color.lightness, c: color.chroma, h: color.hue })
}
