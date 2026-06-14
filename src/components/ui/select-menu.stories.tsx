import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { SelectMenu } from "./select-menu"

const meta = {
  title: "UI/SelectMenu",
  component: SelectMenu,
} satisfies Meta

export default meta
type Story = StoryObj

const options = [
  { value: "neutral", label: "Neutral" },
  { value: "vs-lhp", label: "vs LHP" },
  { value: "vs-rhp", label: "vs RHP" },
]

export const Playground: Story = {
  render: () => {
    const [value, setValue] = useState("neutral")
    return <SelectMenu value={value} onChange={setValue} options={options} />
  },
}
