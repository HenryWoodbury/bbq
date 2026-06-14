import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { EditInPlace } from "./edit-in-place"

const meta = {
  title: "UI/EditInPlace",
  component: EditInPlace,
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("BBQ Default")
    return (
      <div className="text-lg font-semibold text-foreground">
        <EditInPlace value={value} onChange={setValue} maxLength={40} />
      </div>
    )
  },
}
