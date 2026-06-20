"use client"

import { useEffect, useState } from "react"
import { hexToOklch, oklchToHex, oklchToRgb, rgbToOklch } from "@/lib/color"
import { type OklchColorData, toOklch } from "@/lib/heat-map"
import { cn } from "@/lib/utils"
import { type FieldDef, InputFieldGroup } from "./input-field-group"

export type ColorSpace = "oklch" | "rgb" | "hex"

interface ColorInputProps {
  value: OklchColorData
  onChange: (value: OklchColorData) => void
  size?: "sm" | "md" | "lg"
  colorSpace?: ColorSpace
  /**
   * Render a sample color block to the left of the picker. Off by default; the
   * heat-map editor uses its own color representation, so it leaves this unset.
   */
  showSwatch?: boolean
  /** Class overrides for the sample color block. */
  swatchClassName?: string
  /** Click handler for the sample color block (e.g. to open an external picker). */
  onSwatchClick?: () => void
}

type ColorInputSize = NonNullable<ColorInputProps["size"]>

// Sample-block heights, matched to the per-size input-row height.
const SWATCH_HEIGHT: Record<ColorInputSize, string> = {
  sm: "h-8",
  md: "h-9",
  lg: "h-10",
}

// ── OKLCH ────────────────────────────────────────────────────────────────────

const OKLCH_FIELD_DEFS = [
  { key: "lightness", label: "L", type: "number", min: 0, max: 1, step: 0.001 },
  { key: "chroma", label: "C", type: "number", min: 0, max: 0.4, step: 0.001 },
  { key: "hue", label: "H", type: "number", min: 0, max: 360, step: 0.01 },
  { key: "alpha", label: "A", type: "number", min: 0, max: 100, step: 1 },
] as const satisfies readonly Omit<FieldDef, "width">[]

const OKLCH_WIDTHS: Record<ColorInputSize, Record<string, number>> = {
  sm: { lightness: 76, chroma: 76, hue: 84, alpha: 66 },
  md: { lightness: 88, chroma: 88, hue: 96, alpha: 78 },
  lg: { lightness: 100, chroma: 100, hue: 108, alpha: 90 },
}

// ── RGB ──────────────────────────────────────────────────────────────────────

const RGB_FIELD_DEFS = [
  { key: "r", label: "R", type: "number", min: 0, max: 255, step: 1 },
  { key: "g", label: "G", type: "number", min: 0, max: 255, step: 1 },
  { key: "b", label: "B", type: "number", min: 0, max: 255, step: 1 },
  { key: "alpha", label: "A", type: "number", min: 0, max: 100, step: 1 },
] as const satisfies readonly Omit<FieldDef, "width">[]

const RGB_WIDTHS: Record<ColorInputSize, Record<string, number>> = {
  sm: { r: 68, g: 68, b: 68, alpha: 66 },
  md: { r: 80, g: 80, b: 80, alpha: 78 },
  lg: { r: 92, g: 92, b: 92, alpha: 90 },
}

// ── Field builders ────────────────────────────────────────────────────────────

function buildOklchFields(size: ColorInputSize): FieldDef[] {
  return OKLCH_FIELD_DEFS.map((f) => ({
    ...f,
    width: OKLCH_WIDTHS[size][f.key],
  }))
}

function buildRgbFields(size: ColorInputSize): FieldDef[] {
  return RGB_FIELD_DEFS.map((f) => ({ ...f, width: RGB_WIDTHS[size][f.key] }))
}

// ── Draft conversion ──────────────────────────────────────────────────────────

function oklchToDrafts(color: OklchColorData): Record<string, string> {
  return {
    lightness: String(parseFloat(color.lightness.toFixed(3))),
    chroma: String(parseFloat(color.chroma.toFixed(3))),
    hue: String(parseFloat(color.hue.toFixed(2))),
    alpha: String(Math.round(color.alpha * 100)),
  }
}

function rgbToDrafts(color: OklchColorData): Record<string, string> {
  const { r, g, b, alpha } = oklchToRgb(color)
  return {
    r: String(r),
    g: String(g),
    b: String(b),
    alpha: String(Math.round(alpha * 100)),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

function ColorInput({
  value,
  onChange,
  size = "sm",
  colorSpace = "oklch",
  showSwatch = false,
  swatchClassName,
  onSwatchClick,
}: ColorInputProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    colorSpace === "rgb" ? rgbToDrafts(value) : oklchToDrafts(value),
  )
  const [hexDraft, setHexDraft] = useState(() => oklchToHex(value))

  // Sync drafts when value changes from outside OR colorSpace changes
  useEffect(() => {
    if (colorSpace === "rgb") {
      setDrafts(rgbToDrafts(value))
    } else if (colorSpace === "oklch") {
      setDrafts(oklchToDrafts(value))
    } else {
      setHexDraft(oklchToHex(value))
    }
  }, [colorSpace, value])

  // ── OKLCH handlers ──────────────────────────────────────────────────────────

  function handleOklchChange(key: string, raw: string) {
    setDrafts((d) => ({ ...d, [key]: raw }))
    const n = Number(raw)
    if (!Number.isNaN(n) && raw !== "" && raw !== "-" && !raw.endsWith(".")) {
      const fieldDef = OKLCH_FIELD_DEFS.find((f) => f.key === key)
      const clamped = fieldDef
        ? Math.min(Math.max(n, fieldDef.min), fieldDef.max)
        : n
      const stored = key === "alpha" ? clamped / 100 : clamped
      onChange({ ...value, [key]: stored })
    }
  }

  function handleOklchBlur(key: string) {
    const n = Number(drafts[key])
    if (Number.isNaN(n) || drafts[key] === "") {
      const current =
        key === "alpha" ? value.alpha * 100 : value[key as keyof OklchColorData]
      setDrafts((d) => ({ ...d, [key]: String(current) }))
      return
    }
    const fieldDef = OKLCH_FIELD_DEFS.find((f) => f.key === key)
    if (fieldDef) {
      const clamped = Math.min(Math.max(n, fieldDef.min), fieldDef.max)
      if (clamped !== n) setDrafts((d) => ({ ...d, [key]: String(clamped) }))
    }
  }

  // ── RGB handlers ────────────────────────────────────────────────────────────

  function handleRgbChange(key: string, raw: string) {
    setDrafts((d) => ({ ...d, [key]: raw }))
    const n = Number(raw)
    if (!Number.isNaN(n) && raw !== "" && raw !== "-" && !raw.endsWith(".")) {
      const current = rgbToDrafts(value)
      const next = { ...current, [key]: raw }
      const r = Number(next.r)
      const g = Number(next.g)
      const b = Number(next.b)
      const a = Number(next.alpha) / 100
      if ([r, g, b, a].every((x) => !Number.isNaN(x))) {
        onChange(rgbToOklch(r, g, b, a))
      }
    }
  }

  function handleRgbBlur(key: string) {
    const n = Number(drafts[key])
    if (Number.isNaN(n) || drafts[key] === "") {
      setDrafts(rgbToDrafts(value))
    }
  }

  // ── Hex handlers ────────────────────────────────────────────────────────────

  function handleHexChange(raw: string) {
    setHexDraft(raw)
    const normalized = raw.startsWith("#") ? raw : `#${raw}`
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      const oklch = hexToOklch(normalized)
      if (oklch) onChange({ ...oklch, alpha: value.alpha })
    }
  }

  function handleHexBlur() {
    setHexDraft(oklchToHex(value))
  }

  function handleHexAlphaChange(raw: string) {
    setDrafts((d) => ({ ...d, alpha: raw }))
    const n = Number(raw)
    if (!Number.isNaN(n) && raw !== "") {
      onChange({ ...value, alpha: n / 100 })
    }
  }

  function handleHexAlphaBlur() {
    setDrafts((d) => ({ ...d, alpha: String(Math.round(value.alpha * 100)) }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Optional sample color block, to the left of the picker. Off by default;
  // squared (no radius/border) and sized to the input row.
  const swatch = showSwatch ? (
    <button
      type="button"
      aria-label="Selected color"
      onClick={onSwatchClick}
      style={{ backgroundColor: toOklch(value) }}
      className={cn(
        SWATCH_HEIGHT[size],
        "w-14 shrink-0 mb-[1px]",
        onSwatchClick && "cursor-pointer",
        swatchClassName,
      )}
    />
  ) : null

  // `swatch` is null when off, so this single row layout serves both cases.
  if (colorSpace === "hex") {
    return (
      <div className="flex items-end gap-3">
        {swatch}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Hex</span>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            className="h-8 rounded-sm border border-border bg-transparent px-2 text-body focus:outline-none focus:ring-2 focus:ring-ring w-24"
            placeholder="#rrggbb"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted-foreground">A</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={drafts.alpha ?? String(Math.round(value.alpha * 100))}
            onChange={(e) => handleHexAlphaChange(e.target.value)}
            onBlur={handleHexAlphaBlur}
            style={{ width: OKLCH_WIDTHS[size].alpha }}
            className="h-8 rounded-sm border border-border bg-transparent px-2 text-body focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
    )
  }

  const isRgb = colorSpace === "rgb"
  const fields = isRgb ? buildRgbFields(size) : buildOklchFields(size)
  return (
    <div className="flex items-end gap-3">
      {swatch}
      <InputFieldGroup
        fields={fields}
        values={drafts}
        onChange={isRgb ? handleRgbChange : handleOklchChange}
        onBlur={(key) => (isRgb ? handleRgbBlur(key) : handleOklchBlur(key))}
        size={size}
      />
    </div>
  )
}

export { ColorInput }
