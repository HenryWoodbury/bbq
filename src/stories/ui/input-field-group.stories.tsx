import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { type FieldDef, InputFieldGroup } from "@/components/ui/input-field-group"

const meta = {
  title: "UI/InputFieldGroup",
  component: InputFieldGroup,
} satisfies Meta

export default meta
type Story = StoryObj

const fields: FieldDef[] = [
  { key: "max", label: "Max", width: 80 },
  { key: "min", label: "Min", width: 80 },
  { key: "avg", label: "Avg", width: 80 },
  { key: "increments", label: "Count", width: 72, min: 2 },
]

export const HeatMapLimits: Story = {
  render: () => {
    const [values, setValues] = useState<Record<string, number | string>>({
      max: 110,
      min: 90,
      avg: 100,
      increments: 20,
    })
    return (
      <InputFieldGroup
        fields={fields}
        values={values}
        onChange={(key, value) =>
          setValues((prev) => ({ ...prev, [key]: value }))
        }
      />
    )
  },
}
