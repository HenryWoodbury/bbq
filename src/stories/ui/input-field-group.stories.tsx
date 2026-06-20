import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { type FieldDef, InputFieldGroup } from "@/components/ui/input-field-group"

const meta = {
  title: "UI/InputFieldGroup",
  component: InputFieldGroup,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const fields: FieldDef[] = [
  { key: "x", label: "X", width: 72 },
  { key: "y", label: "Y", width: 72 },
  { key: "z", label: "Z", width: 72 },
]

export const Playground: Story = {
  render: (args) => {
    const [values, setValues] = useState<Record<string, number | string>>({
      x: 0,
      y: 0,
      z: 0,
    })
    return (
      <InputFieldGroup
        {...args}
        fields={fields}
        values={values}
        onChange={(key, value) =>
          setValues((prev) => ({ ...prev, [key]: value }))
        }
      />
    )
  },
}
