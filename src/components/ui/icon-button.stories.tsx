import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { IconButton } from "./icon-button"

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  args: { "aria-label": "Edit", size: "md", children: <PencilIcon /> },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Edit" size="sm">
        <PencilIcon />
      </IconButton>
      <IconButton aria-label="Edit" size="md">
        <PencilIcon />
      </IconButton>
      <IconButton aria-label="Delete" size="lg" tooltip="Delete heat map">
        <Trash2Icon />
      </IconButton>
    </div>
  ),
}
