import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta: Meta = {
  title: "Foundations/Colors",
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ backgroundColor: `var(${token})` }}
      />
      <div className="text-xs font-medium text-foreground">{label}</div>
      <code className="text-xs text-muted-foreground">{token}</code>
    </div>
  )
}

function Group({
  title,
  tokens,
}: {
  title: string
  tokens: { token: string; label: string }[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2>{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {tokens.map((t) => (
          <Swatch key={t.token} token={t.token} label={t.label} />
        ))}
      </div>
    </section>
  )
}

/** Each swatch's label is its token minus the `--` (and `color-`) prefix. */
const swatches = (...tokens: string[]) =>
  tokens.map((token) => ({ token, label: token.replace(/^--(?:color-)?/, "") }))

const semantic = swatches(
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--subtle",
  "--subtle-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--overlay",
)

const status = swatches(
  "--success",
  "--success-foreground",
  "--success-border",
  "--error",
  "--error-foreground",
  "--error-border",
  "--warning",
  "--warning-foreground",
  "--warning-border",
  "--info",
  "--info-foreground",
  "--info-border",
  "--positive",
)

const charts = [1, 2, 3, 4, 5].map((n) => ({
  token: `--chart-${n}`,
  label: `chart-${n}`,
}))

const scale = (name: string) =>
  swatches(
    ...[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
      (n) => `--color-${name}-${n}`,
    ),
  )

const neutrals = swatches("--color-zinc-150", "--color-zinc-750")

const ball = swatches("--ball-fill", "--ball-stroke", "--ball-seam")

export const Palette: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-background p-8 text-foreground">
      <Group title="Semantic" tokens={semantic} />
      <Group title="Status" tokens={status} />
      <Group title="Charts" tokens={charts} />
      <Group title="Rain (gray-blue)" tokens={scale("rain")} />
      <Group title="Brick (red)" tokens={scale("brick")} />
      <Group title="Neutral extensions" tokens={neutrals} />
      <Group title="Ball" tokens={ball} />
    </div>
  ),
}
