import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Checkbox } from "@/components/ui/checkbox"

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { args: { defaultChecked: true } }

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox size="sm" defaultChecked />
      <Checkbox size="md" defaultChecked />
      <Checkbox size="lg" defaultChecked />
    </div>
  ),
}
