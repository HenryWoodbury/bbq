import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta: Meta = {
  title: "Foundations/Colors",
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj

type Token = {
  /** CSS var rendered as the swatch background, e.g. "--primary". */
  token?: string
  /**
   * Utility class that paints the swatch background, e.g. "bg-zinc-500". Use for
   * Tailwind default scales whose `--color-*` vars are tree-shaken at runtime —
   * a literal class forces Tailwind to emit it, so values stay canonical.
   */
  swatchClass?: string
  /** Display name, e.g. "primary" or "card / card-foreground". */
  label: string
  /** Utility class(es) callers type, e.g. "bg-primary". Omit for raw vars. */
  util?: string
  /** One-line usage note. */
  purpose?: string
  /** Paired foreground var, drawn as "Aa" sample text on the bg. */
  fg?: string
  /** Paired border var (status tokens), applied as the swatch border. */
  border?: string
}

function Swatch({ token, swatchClass, label, util, purpose, fg, border }: Token) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex h-14 w-full items-center justify-center rounded-md border${swatchClass ? ` ${swatchClass}` : ""}`}
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

function Group({
  title,
  note,
  tokens,
}: {
  title: string
  note?: string
  tokens: Token[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2>{title}</h2>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {tokens.map((t) => (
          <Swatch key={t.label} {...t} />
        ))}
      </div>
    </section>
  )
}

const semantic: Token[] = [
  {
    token: "--background",
    label: "background / foreground",
    util: "bg-background · text-foreground",
    purpose: "Page surface & default text",
    fg: "--foreground",
  },
  {
    token: "--card",
    label: "card / card-foreground",
    util: "bg-card · text-card-foreground",
    purpose: "Cards, inputs, header, table body",
    fg: "--card-foreground",
  },
  {
    token: "--popover",
    label: "popover / popover-foreground",
    util: "bg-popover · text-popover-foreground",
    purpose: "Tooltips, toasts, menus",
    fg: "--popover-foreground",
  },
  {
    token: "--primary",
    label: "primary / primary-foreground",
    util: "bg-primary · text-primary-foreground",
    purpose: "Primary emphasis",
    fg: "--primary-foreground",
  },
  {
    token: "--secondary",
    label: "secondary / secondary-foreground",
    util: "bg-secondary · text-secondary-foreground",
    purpose: "Secondary surfaces",
    fg: "--secondary-foreground",
  },
  {
    token: "--muted",
    label: "muted / muted-foreground",
    util: "bg-muted · text-muted-foreground",
    purpose: "Table headers, captions, secondary text (~70 uses)",
    fg: "--muted-foreground",
  },
  {
    token: "--accent",
    label: "accent / accent-foreground",
    util: "bg-accent · text-accent-foreground",
    purpose: "Hover/active accent surfaces",
    fg: "--accent-foreground",
  },
  {
    token: "--subtle",
    label: "subtle / subtle-foreground",
    util: "bg-subtle · text-subtle-foreground",
    purpose: "Tab-list bg, table-cell text",
    fg: "--subtle-foreground",
  },
  {
    token: "--destructive",
    label: "destructive",
    util: "text-destructive",
    purpose: "Destructive actions",
  },
  {
    token: "--border",
    label: "border",
    util: "border-border",
    purpose: "Default borders/dividers",
  },
  {
    token: "--input",
    label: "input",
    util: "border-input",
    purpose: "Form-control borders (= border value)",
  },
  {
    token: "--ring",
    label: "ring",
    util: "ring-ring · outline-ring",
    purpose: "Focus rings (blue-500)",
  },
  {
    token: "--overlay",
    label: "overlay",
    util: "bg-overlay",
    purpose: "Dialog/drawer scrim (translucent)",
  },
]

const status: Token[] = [
  {
    token: "--success",
    label: "success",
    util: "bg-success · text-success-foreground · border-success-border",
    purpose: "Success alerts, badges",
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
    purpose: "Warning alerts, badges",
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

const charts: Token[] = [1, 2, 3, 4, 5].map((n) => ({
  token: `--chart-${n}`,
  label: `chart-${n}`,
  util: `bg-chart-${n}`,
}))

/** Plain reference-scale swatch: label & utility derived from the var name. */
const scale = (name: string): Token[] =>
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => ({
    token: `--color-${name}-${n}`,
    label: `${name}-${n}`,
    util: `bg-${name}-${n}`,
  }))

// Tailwind tree-shakes unused default-scale vars, so var(--color-zinc-N) is not
// reliably available. Paint each shade with a literal bg-zinc-* class instead —
// canonical Tailwind values, no duplicated definitions. 150 & 750 are our own
// @theme static in-between shades.
const zinc: Token[] = [
  { swatchClass: "bg-zinc-50", label: "zinc-50", util: "bg-zinc-50" },
  { swatchClass: "bg-zinc-100", label: "zinc-100", util: "bg-zinc-100" },
  { swatchClass: "bg-zinc-150", label: "zinc-150", util: "bg-zinc-150", purpose: "Custom in-between" },
  { swatchClass: "bg-zinc-200", label: "zinc-200", util: "bg-zinc-200" },
  { swatchClass: "bg-zinc-300", label: "zinc-300", util: "bg-zinc-300" },
  { swatchClass: "bg-zinc-400", label: "zinc-400", util: "bg-zinc-400" },
  { swatchClass: "bg-zinc-500", label: "zinc-500", util: "bg-zinc-500" },
  { swatchClass: "bg-zinc-600", label: "zinc-600", util: "bg-zinc-600" },
  { swatchClass: "bg-zinc-700", label: "zinc-700", util: "bg-zinc-700" },
  { swatchClass: "bg-zinc-750", label: "zinc-750", util: "bg-zinc-750", purpose: "Custom in-between" },
  { swatchClass: "bg-zinc-800", label: "zinc-800", util: "bg-zinc-800" },
  { swatchClass: "bg-zinc-900", label: "zinc-900", util: "bg-zinc-900" },
  { swatchClass: "bg-zinc-950", label: "zinc-950", util: "bg-zinc-950" },
]

const ball: Token[] = [
  { token: "--ball-fill", label: "ball-fill" },
  { token: "--ball-stroke", label: "ball-stroke" },
  { token: "--ball-seam", label: "ball-seam" },
]

export const Palette: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-background p-8 text-foreground">
      <p className="text-sm text-muted-foreground">
        Paired swatches show the foreground token as <strong>Aa</strong> on its
        background; status swatches also show their border token.
      </p>
      <Group title="Semantic" tokens={semantic} />
      <Group title="Status" tokens={status} />
      <Group
        title="Charts"
        note="Defined; not yet consumed."
        tokens={charts}
      />
      <Group
        title="Rain (gray-blue)"
        note="Reference palette."
        tokens={scale("rain")}
      />
      <Group
        title="Brick (red)"
        note="Reference palette."
        tokens={scale("brick")}
      />
      <Group
        title="Zinc (neutral ramp)"
        note="Tailwind default scale + our 150/750 shades. Painted via bg-zinc-* utilities, so values track Tailwind. Backs muted, border, subtle & table-row hover."
        tokens={zinc}
      />
      <Group
        title="Ball"
        note="Consumed via var() in the ball CSS animation; no utility class."
        tokens={ball}
      />
    </div>
  ),
}
