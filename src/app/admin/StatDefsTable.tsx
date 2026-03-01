"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export type StatDefRow = {
  id: string;
  abbreviation: string;
  name: string | null;
  format: string | null;
};

const columns: ColumnDef<StatDefRow, unknown>[] = [
  {
    accessorKey: "abbreviation",
    header: "Abbreviation",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-50">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "format",
    header: "Format",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
];

export function StatDefsTable({ data }: { data: StatDefRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
