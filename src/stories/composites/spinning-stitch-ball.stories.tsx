import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SpinningStitchBall } from "@/components/spinning-stitch-ball"

const meta = {
  title: "Composites/SpinningStitchBall",
  component: SpinningStitchBall,
  args: { size: 160, paused: false },
  argTypes: {
    size: { control: { type: "range", min: 48, max: 320, step: 8 } },
    spinAxis: { control: "inline-radio", options: ["pitch", "yaw", "roll"] },
    direction: { control: "inline-radio", options: ["ltr", "rtl"] },
    paused: { control: "boolean" },
    rpm: { control: { type: "range", min: 0, max: 120, step: 5 } },
  },
} satisfies Meta<typeof SpinningStitchBall>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Paused: Story = { args: { paused: true } }
