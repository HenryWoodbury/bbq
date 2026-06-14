import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PlusIcon } from "lucide-react"
import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Button", variant: "primary", size: "md" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "destructive", "ghost", "subtle"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    mode: { control: "inline-radio", options: [undefined, "icon"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="subtle">Subtle</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const IconMode: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button mode="icon" size="sm" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button mode="icon" size="md" variant="secondary" aria-label="Add">
        <PlusIcon />
      </Button>
      <Button mode="icon" size="lg" variant="ghost" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
}

export const Disabled: Story = { args: { disabled: true } }
