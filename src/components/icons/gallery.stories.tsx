import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ComponentType } from "react"
import { BaseballIcon, ParkIcon, PlayerAddIcon, PlayerIcon } from "./index"
import * as lucideIcons from "./lucide"
import type { IconSize } from "./types"

const meta: Meta = {
  title: "Icons/Gallery",
  parameters: { layout: "padded" },
}

export default meta
type Story = StoryObj

const custom = [
  { name: "BaseballIcon", Icon: BaseballIcon },
  { name: "ParkIcon", Icon: ParkIcon },
  { name: "PlayerIcon", Icon: PlayerIcon },
  { name: "PlayerAddIcon", Icon: PlayerAddIcon },
] as const

const sizes: IconSize[] = ["xs", "sm", "md", "lg"]

// Reflects the production barrel (src/components/icons/lucide.ts) — i.e. the
// lucide icons actually used in the UI. Sorted for stable display.
const lucide = (
  Object.entries(lucideIcons) as [string, ComponentType<{ size?: number }>][]
).sort(([a], [b]) => a.localeCompare(b))

export const Custom: Story = {
  render: () => (
    <div className="flex flex-col gap-6 text-foreground">
      <h2>Custom SVG icons</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {custom.map(({ name, Icon }) => (
          <div key={name} className="flex flex-col items-center gap-3">
            <div className="flex items-end gap-3">
              {sizes.map((size) => (
                <Icon key={size} size={size} />
              ))}
            </div>
            <code className="text-xs text-muted-foreground">{name}</code>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Lucide: Story = {
  render: () => (
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
            <Icon size={24} />
            <code className="text-center text-xs text-muted-foreground">
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
}
