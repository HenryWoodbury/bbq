import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { BBQ_DEFAULT, type OklchColorData } from "@/lib/heat-map"
import { ColorInput } from "@/components/ui/color-input"

const meta = {
  title: "UI/ColorInput",
  component: ColorInput,
  args: { colorSpace: "oklch", size: "md", showSwatch: true },
  argTypes: {
    colorSpace: { control: "inline-radio", options: ["oklch", "rgb", "hex"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    showSwatch: { control: "boolean" },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const Playground: Story = {
  render: (args) => {
    const [color, setColor] = useState<OklchColorData>({
      ...BBQ_DEFAULT.maxColor,
    })
    return <ColorInput {...args} value={color} onChange={setColor} />
  },
}
