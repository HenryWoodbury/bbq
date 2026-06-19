import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ComponentType } from "react"
import { BaseballIcon, ParkIcon, PlayerAddIcon, PlayerIcon } from "@/components/icons"
import * as lucideIcons from "@/components/icons/lucide"

// One size control drives both galleries. The scale mirrors the sizes the app
// actually renders — IconButton's sm/md/lg svg variants (size-3.5 / 4 / 5).
type IconScale = "sm" | "md" | "lg"
type GalleryArgs = { size: IconScale }

const meta = {
  title: "Icons/Gallery",
  parameters: { layout: "padded" },
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<GalleryArgs>

export default meta
type Story = StoryObj<GalleryArgs>

const custom = [
  { name: "BaseballIcon", Icon: BaseballIcon },
  { name: "ParkIcon", Icon: ParkIcon },
  { name: "PlayerIcon", Icon: PlayerIcon },
  { name: "PlayerAddIcon", Icon: PlayerAddIcon },
] as const

// Custom and lucide icons now share one contract — a numeric px `size`. The
// scale maps to pixels so both galleries render identically under the control.
const ICON_PX: Record<IconScale, number> = { sm: 14, md: 16, lg: 20 }

// Reflects the production barrel (src/components/icons/lucide.ts) — i.e. the
// lucide icons actually used in the UI. Sorted for stable display.
const lucide = (
  Object.entries(lucideIcons) as [string, ComponentType<{ size?: number }>][]
).sort(([a], [b]) => a.localeCompare(b))

export const Custom: Story = {
  render: ({ size }) => (
    <div className="flex flex-col gap-6 text-foreground">
      <h2>Custom SVG icons</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {custom.map(({ name, Icon }) => (
          <div key={name} className="flex flex-col items-center gap-3">
            <Icon size={ICON_PX[size]} />
            <code className="text-xs text-muted-foreground">{name}</code>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Lucide: Story = {
  render: ({ size }) => (
    <div className="flex flex-col gap-6 text-foreground">
      <h2>Lucide icons in use</h2>
      <p className="text-body text-muted-foreground">
        Re-exported from{" "}
        <code>@/components/icons/lucide</code> — the icons actually used across
        the app. Import from the barrel (not <code>lucide-react</code>) to keep
        this gallery accurate.
      </p>
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
        {lucide.map(([name, Icon]) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <Icon size={ICON_PX[size]} />
            <code className="text-center text-xs text-muted-foreground">
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
}
