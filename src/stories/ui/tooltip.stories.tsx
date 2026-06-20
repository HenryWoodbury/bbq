import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type TooltipArgs = {
  content: string
  side: "top" | "right" | "bottom" | "left"
  sideOffset: number
}

// Tooltip is a compound component — meaningful props live on the sub-parts
// (e.g. side/sideOffset on TooltipContent), so the controls are hand-wired.
const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  args: {
    content: "Syncs park factors from Baseball Savant",
    side: "top",
    sideOffset: 6,
  },
  argTypes: {
    content: { control: "text" },
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    sideOffset: { control: { type: "number" } },
  },
} satisfies Meta

export default meta
type Story = StoryObj<TooltipArgs>

// TooltipProvider is supplied globally by the Storybook providers decorator.
export const Playground: Story = {
  render: ({ content, side, sideOffset }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {content}
      </TooltipContent>
    </Tooltip>
  ),
}
