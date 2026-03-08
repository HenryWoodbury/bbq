"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "lucide-react"
import { type ReactNode, useMemo, useState } from "react"
import { DataTable } from "@/components/data-table"
import { FilterGroup } from "@/components/filter-group"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"

export type PlayerRow = {
  id: string
  ottoneuId: number | null
  /** ASCII name from SFBB PLAYERNAME — search fallback */
  playerName: string
  /** Preferred display name from SFBB FGSPECIALCHAR — includes diacritics/accents */
  fgSpecialChar: string | null
  firstName: string | null
  /** For sort */
  lastName: string | null
  active: boolean
  /** ISO date string "YYYY-MM-DD" */
  birthday: string | null
  team: string | null
  mlbLevel: string | null
  fangraphsId: string | null
  bats: string | null
  throws: string | null
  /** Ottoneu-specific eligible positions; empty if no universe entry */
  ottoneuPositions: string[]
  /** PlayerUniverse.fangraphsId — "sa…" prefix indicates MiLB */
  universeFgId: string | null
  /** ID of the PlayerOverride record, if one exists and is active */
  overrideId: string | null
  /** true if this row originates from a manual PlayerOverride (no SFBB record) */
  isManual: boolean
}

/** Strip diacritics so "ramirez" matches "Ramírez", "rodriguez" matches "Rodríguez", etc. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function isMajorLeague(row: PlayerRow): boolean {
  return row.universeFgId !== null && !row.universeFgId.startsWith("sa")
}

function isMinorLeague(row: PlayerRow): boolean {
  return row.universeFgId?.startsWith("sa") ?? false
}

type ActiveFilter = "yes" | "no" | "all"
type LevelFilter = "all" | "mlb" | "milb"

const columns: ColumnDef<PlayerRow, unknown>[] = [
  {
    accessorKey: "ottoneuId",
    header: "Ott ID",
    size: 72,
    cell: ({ getValue }) => {
      const v = getValue() as number | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    id: "displayName",
    accessorFn: (row) => row.fgSpecialChar ?? row.playerName,
    header: "Name",
    size: 160,
    sortingFn: (a, b) => {
      const key = (row: PlayerRow) => {
        if (row.lastName) return row.lastName
        const words = row.playerName.trim().split(/\s+/)
        return words[words.length - 1]
      }
      return key(a.original).localeCompare(key(b.original))
    },
    cell: ({ getValue }) => (
      <span className="font-medium text-zinc-900 dark:text-zinc-50">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "birthday",
    header: "Born",
    size: 90,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    accessorKey: "team",
    header: "Team",
    size: 64,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    accessorKey: "mlbLevel",
    header: "LG",
    size: 56,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    id: "fgId",
    accessorFn: (row) => row.fangraphsId ?? row.universeFgId,
    header: "FG ID",
    size: 80,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      if (!v) return <span className="text-zinc-300 dark:text-zinc-600">—</span>
      return (
        <a
          href={`https://www.fangraphs.com/statss.aspx?playerid=${v}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {v}
        </a>
      )
    },
  },
  {
    accessorKey: "bats",
    header: "B",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    accessorKey: "throws",
    header: "T",
    size: 40,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ?? <span className="text-zinc-300 dark:text-zinc-600">—</span>
    },
  },
  {
    accessorKey: "ottoneuPositions",
    header: "Positions",
    size: 110,
    sortingFn: (a, b) =>
      a.original.ottoneuPositions
        .join("/")
        .localeCompare(b.original.ottoneuPositions.join("/")),
    cell: ({ getValue }) => {
      const pos = getValue() as string[]
      return pos.length > 0 ? (
        pos.join("/")
      ) : (
        <span className="text-zinc-300 dark:text-zinc-600">—</span>
      )
    },
  },
]

export function PlayersTable({
  data,
  onEdit,
  action,
}: {
  data: PlayerRow[]
  onEdit?: (row: PlayerRow) => void
  action?: ReactNode
}) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("yes")
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")

  const displayed = useMemo(() => {
    let rows = data

    if (activeFilter === "yes") rows = rows.filter((r) => r.active)
    else if (activeFilter === "no") rows = rows.filter((r) => !r.active)

    if (levelFilter === "mlb") rows = rows.filter(isMajorLeague)
    else if (levelFilter === "milb") rows = rows.filter(isMinorLeague)

    const q = normalize(search.trim())
    if (q) {
      rows = rows.filter(
        (r) =>
          normalize(r.fgSpecialChar ?? r.playerName).includes(q) ||
          normalize(r.playerName).includes(q) ||
          normalize(r.lastName ?? "").includes(q) ||
          normalize(r.team ?? "").includes(q) ||
          normalize(r.mlbLevel ?? "").includes(q) ||
          r.ottoneuPositions.join("/").toLowerCase().includes(q) ||
          String(r.ottoneuId ?? "").includes(q) ||
          String(r.fangraphsId ?? "").includes(q),
      )
    }

    return rows
  }, [data, activeFilter, levelFilter, search])

  const allColumns = useMemo<ColumnDef<PlayerRow, unknown>[]>(() => {
    if (!onEdit) return columns
    const editCol: ColumnDef<PlayerRow, unknown> = {
      id: "_edit",
      header: "",
      size: 36,
      enableSorting: false,
      cell: ({ row }) => (
        <IconButton
          onClick={() => onEdit(row.original)}
          aria-label="Edit player"
        >
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
      ),
    }
    return [...columns, editCol]
  }, [onEdit])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <FilterGroup
          label="Active"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "all", label: "All" },
          ]}
          value={activeFilter}
          onChange={(v) => setActiveFilter(v as ActiveFilter)}
        />
        <FilterGroup
          label="Level"
          options={[
            { value: "all", label: "All" },
            { value: "mlb", label: "MLB" },
            { value: "milb", label: "MiLB" },
          ]}
          value={levelFilter}
          onChange={(v) => setLevelFilter(v as LevelFilter)}
        />
        <Input
          type="search"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs"
        />
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <DataTable
        columns={allColumns}
        data={displayed}
        defaultPageSize={50}
        defaultSorting={[{ id: "displayName", desc: false }]}
      />
    </div>
  )
}
