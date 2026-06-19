import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { FilterGroup } from "@/components/filter-group"

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

// FilterGroup is controlled, so each story owns its selected value.
function StatefulFilterGroup({
  size,
}: {
  size?: "sm" | "md" | "lg"
}) {
  const [value, setValue] = useState("3")
  return (
    <FilterGroup
      label="Rolling"
      options={options}
      value={value}
      onChange={setValue}
      size={size}
    />
  )
}

export const Playground: Story = {
  render: () => <StatefulFilterGroup />,
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <StatefulFilterGroup size="sm" />
      <StatefulFilterGroup size="md" />
      <StatefulFilterGroup size="lg" />
    </div>
  ),
}
