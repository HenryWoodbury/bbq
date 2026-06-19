import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"

type ParkRow = { rank: number; team: string; venue: string; pf: number }

const columns: ColumnDef<ParkRow, unknown>[] = [
  { accessorKey: "rank", header: "Rk", size: 50 },
  { accessorKey: "team", header: "Team" },
  { accessorKey: "venue", header: "Venue" },
  { accessorKey: "pf", header: "PF", size: 70 },
]

const data: ParkRow[] = [
  { rank: 1, team: "COL", venue: "Coors Field", pf: 112 },
  { rank: 2, team: "BOS", venue: "Fenway Park", pf: 107 },
  { rank: 3, team: "CIN", venue: "Great American Ball Park", pf: 104 },
  { rank: 4, team: "NYY", venue: "Yankee Stadium", pf: 102 },
  { rank: 5, team: "LAD", venue: "Dodger Stadium", pf: 99 },
  { rank: 6, team: "SD", venue: "Petco Park", pf: 94 },
  { rank: 7, team: "SEA", venue: "T-Mobile Park", pf: 91 },
]

const meta = {
  title: "Composites/DataTable",
  component: DataTable,
} satisfies Meta

export default meta
type Story = StoryObj

export const Playground: Story = {
  render: () => (
    <div className="w-[40rem]">
      <DataTable
        columns={columns}
        data={data}
        defaultSorting={[{ id: "pf", desc: true }]}
        showSortIcons
      />
    </div>
  ),
}
