import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { GaugeIcon } from "lucide-react"
import { BaseballIcon, ParkIcon, PlayerAddIcon, PlayerIcon } from "./index"
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

export const LucideUsage: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-foreground">
      <h2>Lucide icons</h2>
      <p className="text-body text-muted-foreground">
        Composites use{" "}
        <a
          className="underline"
          href="https://lucide.dev/icons/"
          target="_blank"
          rel="noreferrer"
        >
          lucide-react
        </a>{" "}
        directly, sized with the <code>size</code> prop:
      </p>
      <div className="flex items-center gap-3">
        <GaugeIcon size={16} />
        <GaugeIcon size={20} />
        <GaugeIcon size={24} />
      </div>
    </div>
  ),
}
