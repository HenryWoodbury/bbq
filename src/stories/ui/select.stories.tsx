import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Select } from "@/components/ui/select"

const meta = {
  title: "UI/Select",
  component: Select,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const options = (
  <>
    <option value="3">3yr</option>
    <option value="2">2yr</option>
    <option value="1">1yr</option>
  </>
)

export const Playground: Story = {
  render: (args) => <Select {...args}>{options}</Select>,
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Select size="sm">{options}</Select>
      <Select size="md">{options}</Select>
      <Select size="lg">{options}</Select>
    </div>
  ),
}
