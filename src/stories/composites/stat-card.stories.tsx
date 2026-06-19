import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { StatCard } from "@/components/stat-card"

const meta = {
  title: "Composites/StatCard",
  component: StatCard,
  args: { label: "Total players", value: 1284 },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total players" value={1284} />
      <StatCard label="Leagues" value={12} />
      <StatCard label="Last sync" value="2h ago" />
    </div>
  ),
}
