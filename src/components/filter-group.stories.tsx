import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { FilterGroup } from "./filter-group"

const meta = {
  title: "Composites/FilterGroup",
  component: FilterGroup,
} satisfies Meta

export default meta
type Story = StoryObj

const options = [
  { value: "3", label: "3yr" },
  { value: "2", label: "2yr" },
  { value: "1", label: "1yr" },
]

export const Rolling: Story = {
  render: () => {
    const [value, setValue] = useState("3")
    return (
      <FilterGroup
        label="Rolling"
        options={options}
        value={value}
        onChange={setValue}
      />
    )
  },
}
