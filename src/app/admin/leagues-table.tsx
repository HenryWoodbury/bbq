"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";

export type LeagueRow = {
  id: string;
  leagueName: string;
  leagueFormat: string | null;
  fantasyPlatform: string | null;
  seasons: number[];
  _count: { members: number; teams: number };
};

const columns: ColumnDef<LeagueRow, unknown>[] = [
  {
    accessorKey: "leagueName",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "leagueFormat",
    header: "Format",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "fantasyPlatform",
    header: "Platform",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "seasons",
    header: "Seasons",
    sortingFn: (a, b) => {
      const aMax = a.original.seasons.length > 0 ? Math.max(...a.original.seasons) : 0;
      const bMax = b.original.seasons.length > 0 ? Math.max(...b.original.seasons) : 0;
      return aMax - bMax;
    },
    cell: ({ getValue }) => {
      const s = getValue() as number[];
      return s.length > 0 ? s.join(", ") : "—";
    },
  },
  {
    id: "members",
    header: "Members",
    accessorFn: (row) => row._count.members,
    cell: ({ getValue }) => getValue() as number,
  },
  {
    id: "teams",
    header: "Teams",
    accessorFn: (row) => row._count.teams,
    cell: ({ getValue }) => getValue() as number,
  },
];

export function LeaguesTable({ data }: { data: LeagueRow[] }) {
  return <DataTable columns={columns} data={data} />;
}
