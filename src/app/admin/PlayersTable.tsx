"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export type PlayerRow = {
  id: string;
  playerName: string;
  positions: string[];
  team: string | null;
  active: boolean;
  fangraphsId: number | null;
  mlbamId: number | null;
  updatedAt: Date;
};

const columns: ColumnDef<PlayerRow, unknown>[] = [
  {
    accessorKey: "playerName",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "positions",
    header: "Pos",
    sortingFn: (a, b) =>
      a.original.positions.join(", ").localeCompare(b.original.positions.join(", ")),
    cell: ({ getValue }) => {
      const pos = getValue() as string[];
      return pos.length > 0 ? pos.join(", ") : "—";
    },
  },
  {
    accessorKey: "team",
    header: "Team",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "active",
    header: "Active",
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="text-emerald-600 dark:text-emerald-400">Y</span>
      ) : (
        <span className="text-zinc-400">N</span>
      ),
  },
  {
    accessorKey: "fangraphsId",
    header: "FG ID",
    cell: ({ getValue }) => (getValue() as number | null) ?? "—",
  },
  {
    accessorKey: "mlbamId",
    header: "MLBAM ID",
    cell: ({ getValue }) => (getValue() as number | null) ?? "—",
  },
];

export function PlayersTable({ data }: { data: PlayerRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
