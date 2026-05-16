import type { CSSProperties } from "react"

export type OklchColorData = {
  lightness: number
  chroma: number
  hue: number
  alpha: number
}

export type HeatMapData = {
  name: string
  min: number
  max: number
  avg: number
  increments: number
  isPivot: boolean
  minColor: OklchColorData
  maxColor: OklchColorData
}

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return ((a + diff * t) + 360) % 360
}

function lerpColor(a: OklchColorData, b: OklchColorData, t: number): OklchColorData {
  return {
    lightness: a.lightness + (b.lightness - a.lightness) * t,
    chroma: a.chroma + (b.chroma - a.chroma) * t,
    hue: lerpHue(a.hue, b.hue, t),
    alpha: a.alpha + (b.alpha - a.alpha) * t,
  }
}

function toOklch(c: OklchColorData): string {
  return `oklch(${(c.lightness * 100).toFixed(2)}% ${c.chroma.toFixed(4)} ${c.hue.toFixed(3)} / ${c.alpha})`
}

export function getHeatMapStyle(value: number, config: HeatMapData): Pick<CSSProperties, "backgroundColor" | "color"> {
  const { min, max, avg, increments, isPivot, minColor, maxColor } = config
  const stepSize = (max - min) / increments

  let color: OklchColorData

  if (value < min) {
    color = minColor
  } else if (value > max) {
    color = maxColor
  } else {
    const step = Math.min(Math.round((value - min) / stepSize), increments)
    const stepsToAvg = Math.round((avg - min) / stepSize)

    if (isPivot) {
      const pivotFromMin: OklchColorData = { lightness: 1, chroma: 0, hue: minColor.hue, alpha: 1 }
      const pivotToMax: OklchColorData = { lightness: 1, chroma: 0, hue: maxColor.hue, alpha: 1 }
      if (step <= stepsToAvg) {
        const t = stepsToAvg > 0 ? step / stepsToAvg : 0
        color = lerpColor(minColor, pivotFromMin, t)
      } else {
        const stepsFromAvg = increments - stepsToAvg
        const t = stepsFromAvg > 0 ? (step - stepsToAvg) / stepsFromAvg : 1
        color = lerpColor(pivotToMax, maxColor, t)
      }
    } else {
      color = lerpColor(minColor, maxColor, step / increments)
    }
  }

  const textColor = color.lightness > 0.6
    ? "oklch(14.5% 0.004 285.75)"
    : "oklch(98.5% 0.002 247.84)"

  return { backgroundColor: toOklch(color), color: textColor }
}
