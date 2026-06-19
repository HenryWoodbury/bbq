import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { TableSkeleton } from "@/components/table-skeleton"

const meta = {
  title: "Composites/TableSkeleton",
  component: TableSkeleton,
  args: { rows: 5 },
  argTypes: { rows: { control: { type: "range", min: 1, max: 12 } } },
} satisfies Meta<typeof TableSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <div className="w-[32rem]">
      <TableSkeleton {...args} />
    </div>
  ),
}
