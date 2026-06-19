import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Textarea } from "@/components/ui/textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: { placeholder: "Notes…", rows: 4, size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => <Textarea {...args} className="w-72" />,
}
