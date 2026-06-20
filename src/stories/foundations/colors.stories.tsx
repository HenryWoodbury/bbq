import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ReactNode } from "react"

const meta: Meta = {
  title: "Foundations/Colors",
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj

// ── Layout helpers ────────────────────────────────────────────────────────────

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2>{title}</h2>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

// ── Paired surface swatch (background + its foreground "Aa") ───────────────────

type Token = {
  token?: string
  label: string
  util?: string
  purpose?: string
  /** Paired foreground var, drawn as "Aa" on the background. */
  fg?: string
  /** Paired border var (status), applied as the swatch border. */
  border?: string
}

function Swatch({ token, label, util, purpose, fg, border }: Token) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex h-14 w-full items-center justify-center rounded-md border"
        style={{
          backgroundColor: token ? `var(${token})` : undefined,
          borderColor: border ? `var(${border})` : "var(--border)",
          color: fg ? `var(${fg})` : undefined,
        }}
      >
        {fg && <span className="text-sm font-medium">Aa</span>}
      </div>
      <div className="text-xs font-medium text-foreground">{label}</div>
      {util && <code className="text-xs text-muted-foreground">{util}</code>}
      {purpose && <p className="text-xs text-muted-foreground">{purpose}</p>}
    </div>
  )
}

function SwatchGrid({ tokens }: { tokens: Token[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {tokens.map((t) => (
        <Swatch key={t.label} {...t} />
      ))}
    </div>
  )
}

const surfaces: Token[] = [
  {
    token: "--background",
    label: "background / foreground",
    util: "bg-background",
    purpose: "Page surface & default text",
    fg: "--foreground",
  },
  {
    token: "--card",
    label: "card",
    util: "bg-card",
    purpose: "Cards, inputs, header, table body",
    fg: "--card-foreground",
  },
  {
    token: "--popover",
    label: "popover",
    util: "bg-popover",
    purpose: "Tooltips, toasts, menus",
    fg: "--popover-foreground",
  },
  {
    token: "--primary",
    label: "primary",
    util: "bg-primary",
    purpose: "Primary emphasis / selected",
    fg: "--primary-foreground",
  },
  {
    token: "--secondary",
    label: "secondary",
    util: "bg-secondary",
    purpose: "Secondary surfaces",
    fg: "--secondary-foreground",
  },
  {
    token: "--muted",
    label: "muted",
    util: "bg-muted",
    purpose: "Table headers, captions",
    fg: "--muted-foreground",
  },
  {
    token: "--accent",
    label: "accent",
    util: "bg-accent",
    purpose: "Hover/active accent surfaces",
    fg: "--accent-foreground",
  },
  {
    token: "--subtle",
    label: "subtle",
    util: "bg-subtle",
    purpose: "Tab-list bg, table-cell text",
    fg: "--subtle-foreground",
  },
  {
    token: "--overlay",
    label: "overlay",
    util: "bg-overlay",
    purpose: "Dialog/drawer scrim (translucent)",
  },
]

// ── Text emphasis (foreground tokens, on the page background) ──────────────────

const textTokens = [
  {
    fg: "--foreground",
    util: "text-foreground",
    purpose: "Primary text",
  },
  {
    fg: "--muted-foreground",
    util: "text-muted-foreground",
    purpose: "Secondary text, captions, headers",
  },
  {
    fg: "--subtle-foreground",
    util: "text-subtle-foreground",
    purpose: "Table-cell text",
  },
  {
    fg: "--destructive",
    util: "text-destructive",
    purpose: "Destructive actions",
  },
]

function TextSamples() {
  return (
    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
      {textTokens.map((t) => (
        <div key={t.util} className="flex items-center gap-4 px-4 py-3">
          <span
            className="w-56 text-lg font-medium"
            style={{ color: `var(${t.fg})` }}
          >
            The quick brown fox
          </span>
          <code className="w-48 text-xs text-muted-foreground">{t.util}</code>
          <span className="text-xs text-muted-foreground">{t.purpose}</span>
        </div>
      ))}
    </div>
  )
}

// ── Borders & focus ───────────────────────────────────────────────────────────

function BorderSamples() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        {
          token: "--border",
          label: "border",
          util: "border-border",
          purpose: "Borders, dividers",
        },
        {
          token: "--input",
          label: "input",
          util: "border-input",
          purpose: "Form-control borders (= border)",
        },
      ].map((b) => (
        <div key={b.label} className="flex flex-col gap-1">
          <div
            className="h-14 w-full rounded-md border-2"
            style={{ borderColor: `var(${b.token})` }}
          />
          <div className="text-xs font-medium text-foreground">{b.label}</div>
          <code className="text-xs text-muted-foreground">{b.util}</code>
          <p className="text-xs text-muted-foreground">{b.purpose}</p>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <div className="h-14 w-full rounded-md ring-2 ring-ring ring-offset-2 ring-offset-background" />
        <div className="text-xs font-medium text-foreground">ring</div>
        <code className="text-xs text-muted-foreground">ring-ring</code>
        <p className="text-xs text-muted-foreground">Focus rings (blue-500)</p>
      </div>
    </div>
  )
}

// ── Interaction states (state → token/utility, kept consistent UI-wide) ────────

type StateRow = {
  state: string
  swatches: string[]
  util: string
  usedBy: string
}

const states: StateRow[] = [
  {
    state: "Focus",
    swatches: ["bg-ring"],
    util: "ring-ring (focus-visible:ring-2)",
    usedBy: "All focusable controls",
  },
  {
    state: "Hover",
    swatches: ["bg-zinc-150", "bg-zinc-800"],
    util: "hover:bg-zinc-150 · dark:hover:bg-zinc-800",
    usedBy: "Ghost / subtle / icon buttons, menu items",
  },
  {
    state: "Active",
    swatches: ["bg-zinc-150", "bg-zinc-750"],
    util: "active:bg-zinc-150 · dark:active:bg-zinc-750",
    usedBy: "Buttons",
  },
  {
    state: "Selected",
    swatches: ["bg-primary"],
    util: "bg-primary · bg-foreground",
    usedBy: "Filter groups, tabs, menu-filter",
  },
  {
    state: "Destructive hover",
    swatches: ["bg-destructive/10"],
    util: "hover:bg-destructive/10",
    usedBy: "Delete buttons / items",
  },
  {
    state: "Disabled",
    swatches: ["bg-foreground opacity-disabled"],
    util: "opacity-disabled (0.6)",
    usedBy: "All controls",
  },
]

function StateTable() {
  return (
    <div className="flex flex-col divide-y divide-border rounded-md border border-border">
      <div className="grid grid-cols-[9rem_5rem_1fr_1fr] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>State</span>
        <span>Swatch</span>
        <span>Token / utility</span>
        <span>Used by</span>
      </div>
      {states.map((s) => (
        <div
          key={s.state}
          className="grid grid-cols-[9rem_5rem_1fr_1fr] items-center gap-4 px-4 py-3"
        >
          <span className="text-sm font-medium text-foreground">{s.state}</span>
          <div className="flex gap-1">
            {s.swatches.map((c) => (
              <div
                key={c}
                className={`h-7 w-7 rounded-sm border border-border ${c}`}
              />
            ))}
          </div>
          <code className="text-xs text-muted-foreground">{s.util}</code>
          <span className="text-xs text-muted-foreground">{s.usedBy}</span>
        </div>
      ))}
    </div>
  )
}

// ── Status (bg + border + foreground triads) ──────────────────────────────────

const status: Token[] = [
  {
    token: "--success",
    label: "success",
    util: "bg-success · text-success-foreground · border-success-border",
    purpose: "Success alerts, toasts",
    fg: "--success-foreground",
    border: "--success-border",
  },
  {
    token: "--error",
    label: "error",
    util: "bg-error · text-error-foreground · border-error-border",
    purpose: "Error alerts, toasts",
    fg: "--error-foreground",
    border: "--error-border",
  },
  {
    token: "--warning",
    label: "warning",
    util: "bg-warning · text-warning-foreground · border-warning-border",
    purpose: "Warning alerts",
    fg: "--warning-foreground",
    border: "--warning-border",
  },
  {
    token: "--info",
    label: "info",
    util: "bg-info · text-info-foreground · border-info-border",
    purpose: "Info alerts, toasts",
    fg: "--info-foreground",
    border: "--info-border",
  },
]

// ── Base color scales (raw ramps tokens are built from) ───────────────────────
// Literal bg-* classes (not interpolated) so Tailwind emits each shade.

const STD_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const ZINC_SHADES = [
  50, 100, 150, 200, 300, 400, 500, 600, 700, 750, 800, 900, 950,
]
// Union column set — zinc's custom 150/750 sit in otherwise-empty columns.
const COLS = ZINC_SHADES

const ZINC = [
  "bg-zinc-50",
  "bg-zinc-100",
  "bg-zinc-150",
  "bg-zinc-200",
  "bg-zinc-300",
  "bg-zinc-400",
  "bg-zinc-500",
  "bg-zinc-600",
  "bg-zinc-700",
  "bg-zinc-750",
  "bg-zinc-800",
  "bg-zinc-900",
  "bg-zinc-950",
]
const RAIN = [
  "bg-rain-50",
  "bg-rain-100",
  "bg-rain-200",
  "bg-rain-300",
  "bg-rain-400",
  "bg-rain-500",
  "bg-rain-600",
  "bg-rain-700",
  "bg-rain-800",
  "bg-rain-900",
  "bg-rain-950",
]
const BRICK = [
  "bg-brick-50",
  "bg-brick-100",
  "bg-brick-200",
  "bg-brick-300",
  "bg-brick-400",
  "bg-brick-500",
  "bg-brick-600",
  "bg-brick-700",
  "bg-brick-800",
  "bg-brick-900",
  "bg-brick-950",
]
const EMERALD = [
  "bg-emerald-50",
  "bg-emerald-100",
  "bg-emerald-200",
  "bg-emerald-300",
  "bg-emerald-400",
  "bg-emerald-500",
  "bg-emerald-600",
  "bg-emerald-700",
  "bg-emerald-800",
  "bg-emerald-900",
  "bg-emerald-950",
]
const AMBER = [
  "bg-amber-50",
  "bg-amber-100",
  "bg-amber-200",
  "bg-amber-300",
  "bg-amber-400",
  "bg-amber-500",
  "bg-amber-600",
  "bg-amber-700",
  "bg-amber-800",
  "bg-amber-900",
  "bg-amber-950",
]
const SKY = [
  "bg-sky-50",
  "bg-sky-100",
  "bg-sky-200",
  "bg-sky-300",
  "bg-sky-400",
  "bg-sky-500",
  "bg-sky-600",
  "bg-sky-700",
  "bg-sky-800",
  "bg-sky-900",
  "bg-sky-950",
]
const RED = [
  "bg-red-50",
  "bg-red-100",
  "bg-red-200",
  "bg-red-300",
  "bg-red-400",
  "bg-red-500",
  "bg-red-600",
  "bg-red-700",
  "bg-red-800",
  "bg-red-900",
  "bg-red-950",
]

function zip(shades: number[], classes: string[]): Record<number, string> {
  const m: Record<number, string> = {}
  shades.forEach((s, i) => {
    m[s] = classes[i]
  })
  return m
}

type ScaleRow = {
  name: string
  note: string
  classBy: Record<number, string>
  custom: "all" | "none" | number[]
}

const scales: ScaleRow[] = [
  {
    name: "zinc",
    note: "neutral",
    classBy: zip(ZINC_SHADES, ZINC),
    custom: [150, 750],
  },
  {
    name: "rain",
    note: "heat-map",
    classBy: zip(STD_SHADES, RAIN),
    custom: "all",
  },
  {
    name: "brick",
    note: "heat-map",
    classBy: zip(STD_SHADES, BRICK),
    custom: "all",
  },
  {
    name: "emerald",
    note: "success",
    classBy: zip(STD_SHADES, EMERALD),
    custom: "none",
  },
  {
    name: "amber",
    note: "warning",
    classBy: zip(STD_SHADES, AMBER),
    custom: "none",
  },
  { name: "sky", note: "info", classBy: zip(STD_SHADES, SKY), custom: "none" },
  { name: "red", note: "error", classBy: zip(STD_SHADES, RED), custom: "none" },
]

// Shades that exist only in our theme (e.g. zinc 150/750), marked on the row.
const customShades = new Set(
  scales.flatMap((s) => (Array.isArray(s.custom) ? s.custom : [])),
)

function CustomDot() {
  return (
    <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground align-middle ring-1 ring-background" />
  )
}

function ScaleTable() {
  // Pivoted: shade numbers run down the rows, hues across the columns.
  const template = `4rem repeat(${scales.length}, minmax(0, 1fr))`
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="grid items-end gap-1"
        style={{ gridTemplateColumns: template }}
      >
        <span />
        {scales.map((s) => (
          <div key={s.name} className="leading-tight">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground">
              {s.name}
              {s.custom === "all" && <CustomDot />}
            </div>
            <div className="text-[10px] text-muted-foreground">{s.note}</div>
          </div>
        ))}
      </div>
      {[...COLS].reverse().map((shade) => (
        <div
          key={shade}
          className="grid items-center gap-1"
          style={{ gridTemplateColumns: template }}
        >
          <span className="flex items-center justify-end gap-1 pr-2 text-[10px] tabular-nums text-muted-foreground">
            {customShades.has(shade) && <CustomDot />}
            {shade}
          </span>
          {scales.map((row) => {
            const cls = row.classBy[shade]
            if (!cls) return <div key={row.name} />
            return (
              <div
                key={row.name}
                title={cls}
                className={`h-8 rounded-sm ${cls}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Ball (consumed via var() in the ball animation) ───────────────────────────

const ball: Token[] = [
  { token: "--ball-fill", label: "ball-fill" },
  { token: "--ball-stroke", label: "ball-stroke" },
  { token: "--ball-seam", label: "ball-seam" },
]

// ── Story ─────────────────────────────────────────────────────────────────────

export const Palette: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-background p-8 text-foreground">
      <p className="text-sm text-muted-foreground">
        Tokens grouped by how they&rsquo;re consumed, to show consistency and
        purpose. Paired swatches show the foreground token as{" "}
        <strong>Aa</strong> on its background.
      </p>
      <Section
        title="Surfaces"
        note="Background + its paired text. The “Aa” reveals whether each surface’s text token is light or dark."
      >
        <SwatchGrid tokens={surfaces} />
      </Section>
      <Section
        title="Text emphasis"
        note="Foreground tokens by emphasis level, on the page background."
      >
        <TextSamples />
      </Section>
      <Section title="Borders & focus">
        <BorderSamples />
      </Section>
      <Section
        title="Interaction states"
        note="The token/utility each component uses for a given state — consistent across the UI."
      >
        <StateTable />
      </Section>
      <Section
        title="Status"
        note="Each status is a bg + border + foreground triad."
      >
        <SwatchGrid tokens={status} />
      </Section>
      <Section
        title="Base color scales"
        note="Tailwind and tailwind-based tokens from 950→50. The • marks custom shades."
      >
        <ScaleTable />
      </Section>
      <Section
        title="Ball"
        note="Consumed via var() in the ball animation; no utility class."
      >
        <SwatchGrid tokens={ball} />
      </Section>
    </div>
  ),
}
