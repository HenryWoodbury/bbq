import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  args: { placeholder: "Player name", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
}

export const Disabled: Story = { args: { disabled: true, value: "Locked" } }
