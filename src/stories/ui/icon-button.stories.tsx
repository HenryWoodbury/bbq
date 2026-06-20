import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { BaseballIcon } from "@/components/icons/baseball-icon"
import { PencilIcon, Trash2Icon } from "@/components/icons/lucide"
import { IconButton } from "@/components/ui/icon-button"

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  args: { "aria-label": "Edit", size: "md", children: <PencilIcon /> },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "destructive"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Edit">
        <PencilIcon />
      </IconButton>
      {/* Muted at rest, destructive red on hover. */}
      <IconButton aria-label="Delete" variant="destructive">
        <Trash2Icon />
      </IconButton>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Baseball" size="sm">
        <BaseballIcon />
      </IconButton>
      <IconButton aria-label="Baseball" size="md">
        <BaseballIcon />
      </IconButton>
      <IconButton aria-label="Baseball" size="lg" tooltip="Baseball">
        <BaseballIcon />
      </IconButton>
    </div>
  ),
}
