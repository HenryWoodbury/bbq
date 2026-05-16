import { describe, expect, it } from "vitest"
import { hexToOklch, oklchToHex } from "./color"
import type { OklchColorData } from "./heat-map"

// ── Palette fixtures ──────────────────────────────────────────────────────────

type PaletteEntry = { color: OklchColorData; hex: string }

const RAIN: PaletteEntry[] = [
  { color: { lightness: 0.9730, chroma: 0.0070, hue: 268.548, alpha: 1 }, hex: "#f4f6fb" },
  { color: { lightness: 0.9429, chroma: 0.0141, hue: 268.490, alpha: 1 }, hex: "#e8ecf6" },
  { color: { lightness: 0.8773, chroma: 0.0284, hue: 263.421, alpha: 1 }, hex: "#cdd7ea" },
  { color: { lightness: 0.7677, chroma: 0.0559, hue: 263.156, alpha: 1 }, hex: "#a1b4d8" },
  { color: { lightness: 0.6412, chroma: 0.0875, hue: 260.849, alpha: 1 }, hex: "#6e8dc2" },
  { color: { lightness: 0.5405, chroma: 0.1038, hue: 261.415, alpha: 1 }, hex: "#4c6eab" },
  { color: { lightness: 0.4959, chroma: 0.1094, hue: 262.940, alpha: 1 }, hex: "#4060a0" },
  { color: { lightness: 0.3970, chroma: 0.0860, hue: 264.255, alpha: 1 }, hex: "#2f4575" },
  { color: { lightness: 0.3602, chroma: 0.0702, hue: 263.991, alpha: 1 }, hex: "#2a3c62" },
  { color: { lightness: 0.3316, chroma: 0.0545, hue: 265.154, alpha: 1 }, hex: "#283552" },
  { color: { lightness: 0.2552, chroma: 0.0415, hue: 267.536, alpha: 1 }, hex: "#1a2237" },
]

const BRICK: PaletteEntry[] = [
  { color: { lightness: 0.9705, chroma: 0.0129, hue: 17.380, alpha: 1 }, hex: "#fef2f2" },
  { color: { lightness: 0.9370, chroma: 0.0286, hue: 17.674, alpha: 1 }, hex: "#fde3e3" },
  { color: { lightness: 0.8871, chroma: 0.0545, hue: 16.827, alpha: 1 }, hex: "#fccccd" },
  { color: { lightness: 0.8105, chroma: 0.0960, hue: 18.566, alpha: 1 }, hex: "#f9a8a9" },
  { color: { lightness: 0.7121, chroma: 0.1540, hue: 20.768, alpha: 1 }, hex: "#f37678" },
  { color: { lightness: 0.6340, chroma: 0.1956, hue: 24.010, alpha: 1 }, hex: "#e94a4c" },
  { color: { lightness: 0.5710, chroma: 0.2052, hue: 26.231, alpha: 1 }, hex: "#d62c2e" },
  { color: { lightness: 0.5063, chroma: 0.1842, hue: 26.381, alpha: 1 }, hex: "#b72224" },
  { color: { lightness: 0.4399, chroma: 0.1537, hue: 25.537, alpha: 1 }, hex: "#951f21" },
  { color: { lightness: 0.3939, chroma: 0.1264, hue: 24.589, alpha: 1 }, hex: "#7c2021" },
  { color: { lightness: 0.2559, chroma: 0.0837, hue: 24.484, alpha: 1 }, hex: "#430c0d" },
]

// ── oklchToHex ────────────────────────────────────────────────────────────────

describe("oklchToHex — rain palette", () => {
  it.each(RAIN)("$hex", ({ color, hex }) => {
    expect(oklchToHex(color)).toBe(hex)
  })
})

describe("oklchToHex — brick palette", () => {
  it.each(BRICK)("$hex", ({ color, hex }) => {
    expect(oklchToHex(color)).toBe(hex)
  })
})

// ── hexToOklch ────────────────────────────────────────────────────────────────

describe("hexToOklch — rain palette", () => {
  it.each(RAIN)("$hex", ({ color, hex }) => {
    const result = hexToOklch(hex)
    expect(result).not.toBeNull()
    expect(result!.lightness).toBeCloseTo(color.lightness, 3)
    expect(result!.chroma).toBeCloseTo(color.chroma, 3)
    expect(result!.hue).toBeCloseTo(color.hue, 1)
    expect(result!.alpha).toBe(1)
  })
})

describe("hexToOklch — brick palette", () => {
  it.each(BRICK)("$hex", ({ color, hex }) => {
    const result = hexToOklch(hex)
    expect(result).not.toBeNull()
    expect(result!.lightness).toBeCloseTo(color.lightness, 3)
    expect(result!.chroma).toBeCloseTo(color.chroma, 3)
    expect(result!.hue).toBeCloseTo(color.hue, 1)
    expect(result!.alpha).toBe(1)
  })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("hexToOklch — edge cases", () => {
  it("returns null for invalid input", () => {
    expect(hexToOklch("notacolor")).toBeNull()
    expect(hexToOklch("")).toBeNull()
  })

  it("accepts hex without # prefix", () => {
    expect(hexToOklch("4060a0")).not.toBeNull()
  })

  it("accepts 3-char hex", () => {
    expect(hexToOklch("#fff")).not.toBeNull()
  })
})
