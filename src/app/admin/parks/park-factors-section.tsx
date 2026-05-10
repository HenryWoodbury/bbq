"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { FilterGroup } from "@/components/filter-group"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select } from "@/components/ui/select"
import { triggerCsvDownload } from "@/lib/csv"
import {
  addRanks,
  applyFallback,
  type DisplayRow,
  FACTOR_COL_IDS,
  FACTOR_COLS,
  type ParkFactorRow,
  toCsv,
} from "@/lib/park-factors"

export type { ParkFactorRow }

type SyncResult = {
  total: number
  upserted: number
  season: number
  batSide: string
  rolling: number
  syncedAt: string
}

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SyncResult }
  | { status: "error"; message: string }

const CURRENT_YEAR = new Date().getFullYear()
const SYNC_YEARS = Array.from(
  { length: CURRENT_YEAR - 2019 },
  (_, i) => CURRENT_YEAR - i,
)

const BAT_SIDE_OPTIONS = [
  { value: "", label: "Both" },
  { value: "R", label: "R" },
  { value: "L", label: "L" },
]

const COLUMNS: ColumnDef<DisplayRow, unknown>[] = [
  {
    accessorKey: "rank",
    header: "Rk.",
    size: 48,
  },
  {
    accessorKey: "teamName",
    header: "Team",
    size: 100,
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "venueName",
    header: "Venue",
    size: 150,
  },
  {
    accessorKey: "season",
    header: "Year",
    size: 84,
    cell: ({ row }) => {
      const { season, rolling } = row.original
      if (rolling === 1) return season.toString()
      return `${season - (rolling - 1)}–${String(season).slice(-2)}`
    },
  },
  ...FACTOR_COLS.map(
    ({ key, header, size }): ColumnDef<DisplayRow, unknown> => ({
      id: key,
      header,
      size,
      accessorFn: (row) => row.factors[key],
      cell: ({ getValue }) => {
        const v = getValue() as number | undefined
        return v !== undefined ? v.toFixed(0) : "—"
      },
    }),
  ),
]

const CENTERED: React.CSSProperties = { textAlign: "center" }

function factorCellStyle(
  _row: DisplayRow,
  columnId: string,
): React.CSSProperties | undefined {
  return FACTOR_COL_IDS.has(columnId) ? CENTERED : undefined
}

function factorHeaderStyle(columnId: string): React.CSSProperties | undefined {
  return FACTOR_COL_IDS.has(columnId) ? CENTERED : undefined
}

function downloadCsv(rows: DisplayRow[], filename: string) {
  triggerCsvDownload(toCsv(rows), filename)
}

export function ParkFactorsSection({
  recentRows,
}: {
  recentRows: ParkFactorRow[]
}) {
  const router = useRouter()

  // ── Sync controls ────────────────────────────────────────────────────────────
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" })
  const [syncSeason, setSyncSeason] = useState(CURRENT_YEAR)
  const [syncBatSide, setSyncBatSide] = useState<"" | "R" | "L">("")
  const [syncRolling, setSyncRolling] = useState<1 | 2 | 3>(3)

  const ROLLING_OPTIONS = [
    { value: "3", label: "3yr" },
    { value: "2", label: "2yr" },
    { value: "1", label: "1yr" },
  ]

  // ── Display filter options derived from data ─────────────────────────────────
  const availableSeasons = [...new Set(recentRows.map((r) => r.season))].sort(
    (a, b) => b - a,
  )

  // ── Display filter state ─────────────────────────────────────────────────────
  const [filterSeason, setFilterSeason] = useState(
    () => availableSeasons[0]?.toString() ?? "",
  )
  const [filterBatSide, setFilterBatSide] = useState("")
  const [filterRolling, setFilterRolling] = useState("3")

  // ── Derived data ─────────────────────────────────────────────────────────────
  const targetRolling = Number(filterRolling)
  const targetSeason = filterSeason ? Number(filterSeason) : null

  const seasonSideRows = recentRows.filter((row) => {
    if (targetSeason !== null && row.season !== targetSeason) return false
    if (row.batSide !== filterBatSide) return false
    return true
  })

  const displayRows = addRanks(applyFallback(seasonSideRows, targetRolling))

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleSync() {
    setSyncState({ status: "loading" })
    try {
      const res = await fetch("/api/admin/park-factors/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: syncSeason,
          batSide: syncBatSide,
          rolling: syncRolling,
        }),
      })
      const data = (await res.json()) as SyncResult | { error: string }
      if (res.ok) {
        setSyncState({ status: "success", result: data as SyncResult })
        router.refresh()
      } else {
        setSyncState({
          status: "error",
          message: (data as { error: string }).error ?? "Sync failed",
        })
      }
    } catch {
      setSyncState({ status: "error", message: "Network error" })
    }
  }

  function handleBatcastExport(batSide: "L" | "R") {
    const season = availableSeasons[0]
    if (!season) return
    const sideRows = recentRows.filter(
      (r) => r.season === season && r.batSide === batSide,
    )
    downloadCsv(
      addRanks(applyFallback(sideRows, 3)),
      `park-factors-batcast-${batSide}-${season}-3yr.csv`,
    )
  }

  return (
    <div className="flex flex-col gap-x-4 gap-y-2">
      <div className="mb-2 pb-4 border-b">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Year</span>
            <Select
              size="sm"
              value={syncSeason}
              onChange={(e) => setSyncSeason(Number(e.target.value))}
            >
              {SYNC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Batter side</span>
            <Select
              size="sm"
              value={syncBatSide}
              onChange={(e) => setSyncBatSide(e.target.value as "" | "R" | "L")}
            >
              <option value="">Both</option>
              <option value="R">Right</option>
              <option value="L">Left</option>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Rolling</span>
            <Select
              size="sm"
              value={syncRolling}
              onChange={(e) =>
                setSyncRolling(Number(e.target.value) as 1 | 2 | 3)
              }
            >
              <option value={3}>3 years</option>
              <option value={2}>2 years</option>
              <option value={1}>1 year</option>
            </Select>
          </label>

          <Button
            onClick={handleSync}
            disabled={syncState.status === "loading"}
            className="min-w-36"
          >
            {syncState.status === "loading" ? "Syncing…" : "Sync from Savant"}
          </Button>
        </div>

        {syncState.status === "loading" && (
          <p className="body-muted mt-2">
            Fetching from Baseball Savant — this may take a moment…
          </p>
        )}
        {syncState.status === "success" && (
          <Alert variant="success" className=" mt-2">
            <strong>{syncState.result.upserted.toLocaleString()}</strong> of{" "}
            <strong>{syncState.result.total.toLocaleString()}</strong> parks
            synced for {syncState.result.season} (
            {syncState.result.batSide
              ? `${syncState.result.batSide} bats`
              : "both sides"}
            , {syncState.result.rolling}-year rolling)
          </Alert>
        )}
        {syncState.status === "error" && (
          <Alert variant="error">{syncState.message}</Alert>
        )}
      </div>

      {/* Display filters + export */}
      {recentRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {availableSeasons.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-body font-normal text-muted-foreground">
                  Season
                </span>
                <Select
                  size="sm"
                  value={filterSeason}
                  onChange={(e) => setFilterSeason(e.target.value)}
                >
                  {availableSeasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <FilterGroup
              label="Bat Side"
              options={BAT_SIDE_OPTIONS}
              value={filterBatSide}
              onChange={setFilterBatSide}
              size="sm"
            />

            {recentRows.length > 0 && (
              <FilterGroup
                label="Rolling Years"
                options={ROLLING_OPTIONS}
                value={filterRolling}
                onChange={setFilterRolling}
                size="sm"
              />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleBatcastExport("L")}>
                Batcast Batting Left
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleBatcastExport("R")}>
                Batcast Batting Right
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const side = filterBatSide || "both"
                  downloadCsv(
                    displayRows,
                    `park-factors-${filterSeason}-${side}-${filterRolling}yr.csv`,
                  )
                }}
              >
                As Filtered
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      {recentRows.length > 0 ? (
        <DataTable
          columns={COLUMNS}
          data={displayRows}
          defaultSorting={[{ id: "index_woba", desc: true }]}
          pagination={false}
          getCellStyle={factorCellStyle}
          getHeaderStyle={factorHeaderStyle}
        />
      ) : (
        <p className="body-muted">No park factors synced yet.</p>
      )}
    </div>
  )
}
