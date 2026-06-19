import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MenuButton } from "@/components/ui/menu-button"

const meta = {
  title: "UI/MenuButton",
  component: MenuButton,
  args: { children: "Sort by", variant: "ghost", size: "sm" },
  argTypes: {
    variant: { control: "inline-radio", options: ["ghost", "secondary"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <MenuButton variant="ghost">Ghost</MenuButton>
      <MenuButton variant="secondary">Secondary</MenuButton>
    </div>
  ),
}
