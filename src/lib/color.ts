import {
  clampRgb,
  formatHex,
  parseHex,
  oklch as toOklchCulori,
  rgb as toRgbCulori,
} from "culori"
import type { OklchColorData } from "./heat-map"

export function hexToOklch(hex: string): OklchColorData | null {
  const parsed = parseHex(hex)
  if (!parsed) return null
  const c = toOklchCulori(parsed)
  if (!c) return null
  return { lightness: c.l, chroma: c.c, hue: c.h ?? 0, alpha: c.alpha ?? 1 }
}

export function oklchToHex(color: OklchColorData): string {
  return formatHex({
    mode: "oklch",
    l: color.lightness,
    c: color.chroma,
    h: color.hue,
  })
}

/** r, g, b are 0–255 integers; a is 0–1. */
export function rgbToOklch(r: number, g: number, b: number, a = 1): OklchColorData {
  const c = toOklchCulori({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255, alpha: a })
  if (!c) return { lightness: 0, chroma: 0, hue: 0, alpha: a }
  return { lightness: c.l, chroma: c.c, hue: c.h ?? 0, alpha: c.alpha ?? 1 }
}

/** Returns r, g, b as 0–255 integers. */
export function oklchToRgb(color: OklchColorData): { r: number; g: number; b: number; alpha: number } {
  const clamped = clampRgb(
    toRgbCulori({ mode: "oklch", l: color.lightness, c: color.chroma, h: color.hue, alpha: color.alpha }),
  )
  if (!clamped) return { r: 0, g: 0, b: 0, alpha: color.alpha }
  return {
    r: Math.round((clamped.r ?? 0) * 255),
    g: Math.round((clamped.g ?? 0) * 255),
    b: Math.round((clamped.b ?? 0) * 255),
    alpha: clamped.alpha ?? 1,
  }
}

/** Returns "#rrggbb". r, g, b are 0–255 integers. */
export function rgbToHex(r: number, g: number, b: number): string {
  return formatHex({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 })
}

/** Returns null for invalid hex. r, g, b are 0–255 integers. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const parsed = parseHex(hex)
  if (!parsed) return null
  const c = toRgbCulori(parsed)
  if (!c) return null
  return {
    r: Math.round((c.r ?? 0) * 255),
    g: Math.round((c.g ?? 0) * 255),
    b: Math.round((c.b ?? 0) * 255),
  }
}
