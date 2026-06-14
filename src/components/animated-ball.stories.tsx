import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AnimatedBall } from "./animated-ball"

const meta = {
  title: "Composites/AnimatedBall",
  component: AnimatedBall,
  args: { size: 160 },
  argTypes: {
    size: { control: { type: "range", min: 48, max: 320, step: 8 } },
  },
} satisfies Meta<typeof AnimatedBall>

export default meta
type Story = StoryObj<typeof meta>

// Click the ball to pause/resume the spin.
export const Playground: Story = {}
