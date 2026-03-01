"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export type PlayerRow = {
  id: string;
  playerName: string;
  positions: string[];
  fangraphsId: number | null;
  fangraphsMinorsId: string | null;
  mlbamId: number | null;
  birthday: Date | null;
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
    header: "Positions",
    sortingFn: (a, b) => {
      const aStr = a.original.positions.join(", ");
      const bStr = b.original.positions.join(", ");
      return aStr.localeCompare(bStr);
    },
    cell: ({ getValue }) => {
      const pos = getValue() as string[];
      return pos.length > 0 ? pos.join(", ") : "—";
    },
  },
  {
    accessorKey: "fangraphsId",
    header: "FG ID",
    cell: ({ getValue }) => {
      const v = getValue() as number | null;
      return v ?? "—";
    },
  },
  {
    accessorKey: "fangraphsMinorsId",
    header: "FG Minor ID",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "mlbamId",
    header: "MLBAM ID",
    cell: ({ getValue }) => {
      const v = getValue() as number | null;
      return v ?? "—";
    },
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
    cell: ({ getValue }) => {
      const v = getValue() as Date | null;
      return v ? new Date(v).toLocaleDateString() : "—";
    },
  },
];

export function PlayersTable({ data }: { data: PlayerRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
