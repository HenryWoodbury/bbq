import { describe, expect, it } from "vitest"
import {
  getHeatMapStyle,
  type HeatMapData,
  type OklchColorData,
} from "./heat-map"

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBg(style: ReturnType<typeof getHeatMapStyle>): {
  l: number
  c: number
  h: number
  a: number
} {
  const bg = style.backgroundColor ?? ""
  const m = bg.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\)/)
  if (!m) throw new Error(`Cannot parse oklch from: ${bg}`)
  return {
    l: parseFloat(m[1]) / 100,
    c: parseFloat(m[2]),
    h: parseFloat(m[3]),
    a: parseFloat(m[4]),
  }
}

function components(value: number, config: HeatMapData) {
  return parseBg(getHeatMapStyle(value, config))
}

function expectColor(
  value: number,
  config: HeatMapData,
  expected: OklchColorData,
) {
  const { l, c, h } = components(value, config)
  expect(l).toBeCloseTo(expected.lightness, 3)
  expect(c).toBeCloseTo(expected.chroma, 3)
  expect(h).toBeCloseTo(expected.hue, 2)
}

const DARK_TEXT = "oklch(14.5% 0.004 285.75)"
const LIGHT_TEXT = "oklch(98.5% 0.002 247.84)"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BLUE: OklchColorData = {
  lightness: 0.4959,
  chroma: 0.1094,
  hue: 262.94,
  alpha: 1,
}
const RED: OklchColorData = {
  lightness: 0.5063,
  chroma: 0.1842,
  hue: 26.381,
  alpha: 1,
}

const WHITE: OklchColorData = { lightness: 1, chroma: 0, hue: 0, alpha: 1 }

// Default: blue→(white pivot)→red, 90–110, avg 100, 20 increments (stepSize=1, 10 steps per side)
const DEFAULT: HeatMapData = {
  id: 1,
  name: "Default",
  min: 90,
  max: 110,
  avg: 100,
  increments: 20,
  isPivot: true,
  curve: 1,
  curveDark: 1,
  minColor: BLUE,
  avgColor: WHITE,
  maxColor: RED,
  minDarkColor: { lightness: 0.3307, chroma: 0.1094, hue: 262.94, alpha: 1 },
  avgDarkColor: { lightness: 0.667, chroma: 0, hue: 0, alpha: 1 },
  maxDarkColor: { lightness: 0.3377, chroma: 0.1842, hue: 26.381, alpha: 1 },
}

// Custom: green→(white pivot)→orange, 75–125, avg 100, 10 increments (stepSize=5, 5 steps per side)
const GREEN: OklchColorData = {
  lightness: 0.55,
  chroma: 0.18,
  hue: 140.0,
  alpha: 1,
}
const ORANGE: OklchColorData = {
  lightness: 0.75,
  chroma: 0.16,
  hue: 85.0,
  alpha: 1,
}

const CUSTOM: HeatMapData = {
  id: 2,
  name: "Custom",
  min: 75,
  max: 125,
  avg: 100,
  increments: 10,
  isPivot: true,
  curve: 1,
  curveDark: 1,
  minColor: GREEN,
  avgColor: WHITE,
  maxColor: ORANGE,
  minDarkColor: { lightness: 0.367, chroma: 0.12, hue: 140.0, alpha: 1 },
  avgDarkColor: { lightness: 0.667, chroma: 0, hue: 0, alpha: 1 },
  maxDarkColor: { lightness: 0.5003, chroma: 0.107, hue: 85.0, alpha: 1 },
}

// Same as DEFAULT but continuous (no pivot)
const CONTINUOUS: HeatMapData = { ...DEFAULT, isPivot: false }

// ── Default pivot config ───────────────────────────────────────────────────────

describe("getHeatMapStyle — default pivot config (blue→white→red, 90–110)", () => {
  describe("clamping", () => {
    it("value below min returns min color", () => {
      expectColor(89, DEFAULT, BLUE)
    })

    it("values well below min return min color", () => {
      expectColor(50, DEFAULT, BLUE)
    })

    it("value above max returns max color", () => {
      expectColor(111, DEFAULT, RED)
    })

    it("values well above max return max color", () => {
      expectColor(200, DEFAULT, RED)
    })
  })

  describe("exact boundaries", () => {
    it("min (90) produces min color", () => {
      expectColor(90, DEFAULT, BLUE)
    })

    it("avg (100) produces white pivot (L=1, C=0)", () => {
      const { l, c } = components(100, DEFAULT)
      expect(l).toBeCloseTo(1, 3)
      expect(c).toBeCloseTo(0, 4)
    })

    it("max (110) produces max color", () => {
      expectColor(110, DEFAULT, RED)
    })
  })

  describe("gradient steps", () => {
    it("value 91 is 10% toward pivot (step 1 of 10)", () => {
      const { l } = components(91, DEFAULT)
      expect(l).toBeCloseTo(BLUE.lightness + 0.1 * (1 - BLUE.lightness), 3)
    })

    it("value 95 is 50% toward pivot (step 5 of 10)", () => {
      const { l, c } = components(95, DEFAULT)
      expect(l).toBeCloseTo(BLUE.lightness + 0.5 * (1 - BLUE.lightness), 3)
      expect(c).toBeCloseTo(BLUE.chroma * 0.5, 4)
    })

    it("value 99 is 90% toward pivot (step 9 of 10)", () => {
      const { l } = components(99, DEFAULT)
      expect(l).toBeCloseTo(BLUE.lightness + 0.9 * (1 - BLUE.lightness), 3)
    })

    it("value 101 is 10% toward max from pivot (step 1 of 10)", () => {
      const { l, c } = components(101, DEFAULT)
      expect(l).toBeCloseTo(1 + 0.1 * (RED.lightness - 1), 3)
      expect(c).toBeCloseTo(RED.chroma * 0.1, 4)
    })

    it("value 105 is 50% toward max from pivot (step 5 of 10)", () => {
      const { l, c } = components(105, DEFAULT)
      expect(l).toBeCloseTo(1 + 0.5 * (RED.lightness - 1), 3)
      expect(c).toBeCloseTo(RED.chroma * 0.5, 4)
    })

    it("value 109 is 90% toward max from pivot (step 9 of 10)", () => {
      const { l } = components(109, DEFAULT)
      expect(l).toBeCloseTo(1 + 0.9 * (RED.lightness - 1), 3)
    })
  })

  describe("hue stability in pivot mode", () => {
    it("all blue-side values (90–100) retain min hue", () => {
      for (const v of [90, 91, 95, 99, 100]) {
        expect(components(v, DEFAULT).h).toBeCloseTo(BLUE.hue, 2)
      }
    })

    it("all red-side values (101–110) retain max hue", () => {
      for (const v of [101, 105, 109, 110]) {
        expect(components(v, DEFAULT).h).toBeCloseTo(RED.hue, 2)
      }
    })
  })

  describe("text contrast", () => {
    it("dark backgrounds (min, max) get light text", () => {
      expect(getHeatMapStyle(90, DEFAULT).color).toBe(LIGHT_TEXT)
      expect(getHeatMapStyle(110, DEFAULT).color).toBe(LIGHT_TEXT)
    })

    it("light background (avg/white) gets dark text", () => {
      expect(getHeatMapStyle(100, DEFAULT).color).toBe(DARK_TEXT)
    })

    it("value 93 (L≈0.647, above threshold) gets dark text", () => {
      // L = 0.4959 + 0.3 * (1 - 0.4959) = 0.647
      expect(getHeatMapStyle(93, DEFAULT).color).toBe(DARK_TEXT)
    })

    it("value 92 (L≈0.597, below threshold) gets light text", () => {
      // L = 0.4959 + 0.2 * (1 - 0.4959) = 0.597
      expect(getHeatMapStyle(92, DEFAULT).color).toBe(LIGHT_TEXT)
    })

    it("value 108 (L≈0.605, above threshold) gets dark text", () => {
      // L = 1 + 0.8 * (0.5063 - 1) = 0.605
      expect(getHeatMapStyle(108, DEFAULT).color).toBe(DARK_TEXT)
    })

    it("value 109 (L≈0.556, below threshold) gets light text", () => {
      // L = 1 + 0.9 * (0.5063 - 1) = 0.556
      expect(getHeatMapStyle(109, DEFAULT).color).toBe(LIGHT_TEXT)
    })
  })
})

// ── Custom pivot config ────────────────────────────────────────────────────────

describe("getHeatMapStyle — custom pivot config (green→white→orange, 75–125, 10 increments)", () => {
  // stepSize=5, stepsToAvg=5, stepsFromAvg=5

  describe("clamping", () => {
    it("value below min (74) returns min color", () => {
      expectColor(74, CUSTOM, GREEN)
    })

    it("value above max (126) returns max color", () => {
      expectColor(126, CUSTOM, ORANGE)
    })
  })

  describe("exact boundaries", () => {
    it("min (75) produces min color", () => {
      expectColor(75, CUSTOM, GREEN)
    })

    it("avg (100) produces white pivot (L=1, C=0)", () => {
      const { l, c } = components(100, CUSTOM)
      expect(l).toBeCloseTo(1, 3)
      expect(c).toBeCloseTo(0, 4)
    })

    it("max (125) produces max color", () => {
      expectColor(125, CUSTOM, ORANGE)
    })
  })

  describe("gradient steps", () => {
    it("value 87 is 40% toward pivot (step=Math.round(2.4)=2 of 5)", () => {
      const { l, h } = components(87, CUSTOM)
      expect(l).toBeCloseTo(GREEN.lightness + 0.4 * (1 - GREEN.lightness), 3)
      expect(h).toBeCloseTo(GREEN.hue, 2)
    })

    it("value 113 is 60% toward max from pivot (step=Math.round(7.6)=8, offset 3 of 5)", () => {
      const { l, h } = components(113, CUSTOM)
      expect(l).toBeCloseTo(1 + 0.6 * (ORANGE.lightness - 1), 3)
      expect(h).toBeCloseTo(ORANGE.hue, 2)
    })
  })

  describe("hue stability", () => {
    it("green-side values (75–100) retain green hue", () => {
      for (const v of [75, 80, 90, 100]) {
        expect(components(v, CUSTOM).h).toBeCloseTo(GREEN.hue, 2)
      }
    })

    it("orange-side values (105–125) retain orange hue", () => {
      for (const v of [105, 110, 120, 125]) {
        expect(components(v, CUSTOM).h).toBeCloseTo(ORANGE.hue, 2)
      }
    })
  })
})

// ── Continuous mode ────────────────────────────────────────────────────────────

describe("getHeatMapStyle — continuous mode (isPivot=false)", () => {
  it("min (90) produces min color", () => {
    expectColor(90, CONTINUOUS, BLUE)
  })

  it("max (110) produces max color", () => {
    expectColor(110, CONTINUOUS, RED)
  })

  it("midpoint (100) hue is interpolated — neither blue nor red hue", () => {
    // Shortest-arc from 262.940→26.381 passes through ~324.66 at t=0.5
    const { h } = components(100, CONTINUOUS)
    expect(h).not.toBeCloseTo(BLUE.hue, 0)
    expect(h).not.toBeCloseTo(RED.hue, 0)
    expect(h).toBeCloseTo(324.66, 0)
  })

  it("midpoint (100) is not white — avg is not a pivot", () => {
    const { l } = components(100, CONTINUOUS)
    expect(l).not.toBeCloseTo(1, 1)
  })
})

// ── Power curve ────────────────────────────────────────────────────────────────

describe("getHeatMapStyle — power curve (k=2, continuous)", () => {
  const CURVED: HeatMapData = { ...CONTINUOUS, curve: 2 }

  it("min (90) is unchanged", () => {
    expectColor(90, CURVED, BLUE)
  })

  it("max (110) is unchanged", () => {
    expectColor(110, CURVED, RED)
  })

  it("value 95 (step=5/20, t=0.25 → t'=0.25^0.5=0.5 curved)", () => {
    const { l } = components(95, CURVED)
    const tPrime = Math.pow(0.25, 0.5) // 0.5
    expect(l).toBeCloseTo(BLUE.lightness + tPrime * (RED.lightness - BLUE.lightness), 3)
  })

  it("k=1 matches linear", () => {
    const { l: lLinear } = components(95, CONTINUOUS)
    const { l: lCurved } = components(95, { ...CONTINUOUS, curve: 1 })
    expect(lLinear).toBeCloseTo(lCurved, 5)
  })
})

describe("getHeatMapStyle — power curve (k=2, pivot)", () => {
  // DEFAULT: blue→white→red, 90–110, avg 100, 20 increments (10 steps per side)
  const CURVED: HeatMapData = { ...DEFAULT, curve: 2 }

  it("min (90) and max (110) are unchanged", () => {
    expectColor(90, CURVED, BLUE)
    expectColor(110, CURVED, RED)
  })

  it("lower half: value 95 (step 5 of 10) measures distFromAvg=0.5 → t'=1-√0.5≈0.293", () => {
    // distFromAvg = (10-5)/10 = 0.5; applyCurve(0.5, 2) = √0.5 ≈ 0.707; t_lerp = 1 - 0.707 ≈ 0.293
    const { l } = components(95, CURVED)
    const tLerp = 1 - Math.pow(0.5, 0.5)
    expect(l).toBeCloseTo(BLUE.lightness + tLerp * (1 - BLUE.lightness), 3)
  })

  it("upper half: value 105 (step 5 of 10 from avg) measures distFromAvg=0.5 → t'=√0.5≈0.707", () => {
    // t = (step-stepsToAvg)/stepsFromAvg = 5/10 = 0.5; applyCurve(0.5, 2) = √0.5 ≈ 0.707
    const { l } = components(105, CURVED)
    const tLerp = Math.pow(0.5, 0.5)
    expect(l).toBeCloseTo(1 + tLerp * (RED.lightness - 1), 3)
  })

  it("lower and upper halves are symmetric at equidistant points from avg (k=2)", () => {
    const { l: lBelow } = components(95, CURVED)
    const { l: lAbove } = components(105, CURVED)
    // Both are 5 steps from avg; curve applied identically → same L if min/max lightness are symmetric
    // Here BLUE.lightness ≈ 0.4959, RED.lightness ≈ 0.5063, so ~equal
    expect(Math.abs(lBelow - lAbove)).toBeLessThan(0.02)
  })

  it("k=1 pivot matches original linear behaviour", () => {
    const { l: lLinear } = components(95, DEFAULT)
    const { l: lCurved } = components(95, { ...DEFAULT, curve: 1 })
    expect(lLinear).toBeCloseTo(lCurved, 5)
  })
})
