import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { BBQ_DEFAULT, type OklchColorData, toOklch } from "@/lib/heat-map"
import { ColorInput } from "./color-input"

const meta = {
  title: "UI/ColorInput",
  component: ColorInput,
  args: { colorSpace: "oklch", size: "md", label: "Max color" },
  argTypes: {
    colorSpace: { control: "inline-radio", options: ["oklch", "rgb", "hex"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const Playground: Story = {
  render: (args) => {
    const [color, setColor] = useState<OklchColorData>({
      ...BBQ_DEFAULT.maxColor,
    })
    return (
      <div className="flex items-center gap-4">
        <ColorInput {...args} value={color} onChange={setColor} />
        <div
          className="h-12 w-12 rounded-md border border-border"
          style={{ backgroundColor: toOklch(color) }}
        />
      </div>
    )
  },
}
