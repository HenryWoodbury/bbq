import { useEffect, useState } from "react"
import { hexToOklch, hexToRgb, oklchToHex, oklchToRgb, rgbToOklch } from "@/lib/color"
import { type OklchColorData, toOklch } from "@/lib/heat-map"
import { type FieldDef, InputFieldGroup } from "./input-field-group"

export type ColorSpace = "oklch" | "rgb" | "hex"

interface ColorInputProps {
  label?: string
  value: OklchColorData
  onChange: (value: OklchColorData) => void
  size?: "sm" | "md" | "lg"
  colorSpace?: ColorSpace
}

type ColorInputSize = NonNullable<ColorInputProps["size"]>

// ── OKLCH ────────────────────────────────────────────────────────────────────

const OKLCH_FIELD_DEFS = [
  { key: "lightness", label: "L", type: "number", min: 0, max: 1, step: 0.001 },
  { key: "chroma", label: "C", type: "number", min: 0, max: 0.4, step: 0.001 },
  { key: "hue", label: "H", type: "number", min: 0, max: 360, step: 0.001 },
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
  return OKLCH_FIELD_DEFS.map((f) => ({ ...f, width: OKLCH_WIDTHS[size][f.key] }))
}

function buildRgbFields(size: ColorInputSize): FieldDef[] {
  return RGB_FIELD_DEFS.map((f) => ({ ...f, width: RGB_WIDTHS[size][f.key] }))
}

// ── Draft conversion ──────────────────────────────────────────────────────────

function oklchToDrafts(color: OklchColorData): Record<string, string> {
  return {
    lightness: String(parseFloat(color.lightness.toFixed(3))),
    chroma: String(parseFloat(color.chroma.toFixed(3))),
    hue: String(parseFloat(color.hue.toFixed(3))),
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

function ColorInput({ label, value, onChange, size = "sm", colorSpace = "oklch" }: ColorInputProps) {
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
  }, [value.lightness, value.chroma, value.hue, value.alpha, colorSpace])

  // ── OKLCH handlers ──────────────────────────────────────────────────────────

  function handleOklchChange(key: string, raw: string) {
    setDrafts((d) => ({ ...d, [key]: raw }))
    const n = Number(raw)
    if (!Number.isNaN(n) && raw !== "" && raw !== "-" && !raw.endsWith(".")) {
      const stored = key === "alpha" ? n / 100 : n
      onChange({ ...value, [key]: stored })
    }
  }

  function handleOklchBlur(key: string) {
    const n = Number(drafts[key])
    if (Number.isNaN(n) || drafts[key] === "") {
      const current = key === "alpha" ? value.alpha * 100 : value[key as keyof OklchColorData]
      setDrafts((d) => ({ ...d, [key]: String(current) }))
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

  const swatch = (
    <div
      aria-hidden="true"
      className="h-5 w-5 rounded border border-border shrink-0"
      style={{ backgroundColor: toOklch(value) }}
    />
  )

  if (colorSpace === "hex") {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {swatch}
          </div>
        )}
        <div className="flex items-end gap-2">
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
              className="h-8 rounded-sm border border-border bg-transparent px-2 text-body focus:outline-none focus:ring-2 focus:ring-ring w-14"
            />
          </label>
        </div>
      </div>
    )
  }

  const isRgb = colorSpace === "rgb"
  const fields = isRgb ? buildRgbFields(size) : buildOklchFields(size)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {swatch}
        </div>
      )}
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
