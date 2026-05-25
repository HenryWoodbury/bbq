import type { CSSProperties } from "react"

export type OklchColorData = {
  lightness: number
  chroma: number
  hue: number
  alpha: number
}

export type HeatMapData = {
  id: number
  name: string
  min: number
  max: number
  avg: number
  increments: number
  isPivot: boolean
  minColor: OklchColorData
  avgColor: OklchColorData
  maxColor: OklchColorData
  minDarkColor: OklchColorData
  avgDarkColor: OklchColorData
  maxDarkColor: OklchColorData
}

export const BBQ_DEFAULT = {
  min: 90,
  max: 110,
  avg: 100,
  increments: 20,
  isPivot: true,
  minColor: { lightness: 0.4959, chroma: 0.1094, hue: 262.94, alpha: 1 },
  avgColor: { lightness: 1, chroma: 0, hue: 0, alpha: 1 },
  maxColor: { lightness: 0.5063, chroma: 0.1842, hue: 26.381, alpha: 1 },
  minDarkColor: { lightness: 0.3307, chroma: 0.1094, hue: 262.94, alpha: 1 },
  avgDarkColor: { lightness: 0.6670, chroma: 0, hue: 0, alpha: 1 },
  maxDarkColor: { lightness: 0.3377, chroma: 0.1842, hue: 26.381, alpha: 1 },
} as const

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return (a + diff * t + 360) % 360
}

export function lerpColor(
  a: OklchColorData,
  b: OklchColorData,
  t: number,
): OklchColorData {
  return {
    lightness: a.lightness + (b.lightness - a.lightness) * t,
    chroma: a.chroma + (b.chroma - a.chroma) * t,
    hue: lerpHue(a.hue, b.hue, t),
    alpha: a.alpha + (b.alpha - a.alpha) * t,
  }
}

export function toOklch(c: OklchColorData): string {
  return `oklch(${(c.lightness * 100).toFixed(2)}% ${c.chroma.toFixed(4)} ${c.hue.toFixed(3)} / ${c.alpha})`
}

type HeatMapStyleOptions = {
  isDark?: boolean
}

/** Returns the interpolated OklchColorData at a given step index (0 = min color, increments = max color). */
export function getStepColor(step: number, config: HeatMapData): OklchColorData {
  const { increments, isPivot, minColor, avgColor, maxColor } = config
  const stepsToAvg = Math.round(
    (config.avg - config.min) / ((config.max - config.min) / increments),
  )
  const clampedStep = Math.min(Math.max(step, 0), increments)

  if (isPivot && increments > 1) {
    const pivotFromMin: OklchColorData = { ...avgColor, hue: minColor.hue }
    const pivotToMax: OklchColorData = { ...avgColor, hue: maxColor.hue }
    if (clampedStep <= stepsToAvg) {
      const t = stepsToAvg > 0 ? clampedStep / stepsToAvg : 0
      return lerpColor(minColor, pivotFromMin, t)
    }
    const stepsFromAvg = increments - stepsToAvg
    const t = stepsFromAvg > 0 ? (clampedStep - stepsToAvg) / stepsFromAvg : 1
    return lerpColor(pivotToMax, maxColor, t)
  }
  return lerpColor(minColor, maxColor, clampedStep / increments)
}

export function getConfigForTheme(config: HeatMapData, isDark: boolean): HeatMapData {
  if (!isDark) return config
  return { ...config, minColor: config.minDarkColor, avgColor: config.avgDarkColor, maxColor: config.maxDarkColor }
}

export function getHeatMapStyle(
  value: number,
  config: HeatMapData,
  { isDark = false }: HeatMapStyleOptions = {},
): Pick<CSSProperties, "backgroundColor" | "color"> {
  const workingConfig = getConfigForTheme(config, isDark)

  const { min, max, increments } = workingConfig
  const stepSize = (max - min) / increments

  let color: OklchColorData

  if (value < min) {
    color = workingConfig.minColor
  } else if (value > max) {
    color = workingConfig.maxColor
  } else {
    const step = Math.min(Math.round((value - min) / stepSize), increments)
    color = getStepColor(step, workingConfig)
  }

  const textColor =
    color.lightness > 0.6
      ? "oklch(14.5% 0.004 285.75)"
      : "oklch(98.5% 0.002 247.84)"

  return { backgroundColor: toOklch(color), color: textColor }
}
