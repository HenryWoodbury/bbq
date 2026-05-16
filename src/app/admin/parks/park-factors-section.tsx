"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { FilterGroup } from "@/components/filter-group"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { showToast } from "@/components/ui/sonner"
import { triggerCsvDownload } from "@/lib/csv"
import {
  getHeatMapStyle,
  type HeatMapData,
  type OklchColorData,
  toOklch,
} from "@/lib/heat-map"
import {
  addRanks,
  applyFallback,
  type DisplayRow,
  FACTOR_COL_IDS,
  FACTOR_COLS,
  HEAT_MAP_COL_IDS,
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

type SyncRecord = {
  id: string
  season: number
  batSide: string
  rolling: number
  total: number
  upserted: number
  createdAt: string
}

type GroupedSync = {
  season: number
  batSide: string
  rolling: number
  total: number
  syncedAt: string
}

type SortCol = keyof GroupedSync
type SortDir = "asc" | "desc"

type SaveState =
  | { status: "idle" }
  | { status: "loading" }
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

const ROLLING_OPTIONS = [
  { value: "3", label: "3yr" },
  { value: "2", label: "2yr" },
  { value: "1", label: "1yr" },
]

const COLUMNS: ColumnDef<DisplayRow, unknown>[] = [
  {
    accessorKey: "rank",
    header: "Rk",
    size: 50,
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

function factorHeaderStyle(columnId: string): React.CSSProperties | undefined {
  return FACTOR_COL_IDS.has(columnId) || columnId === "rank"
    ? CENTERED
    : undefined
}

function downloadCsv(rows: DisplayRow[], filename: string) {
  triggerCsvDownload(toCsv(rows), filename)
}

function groupSyncs(records: SyncRecord[]): GroupedSync[] {
  const map = new Map<string, GroupedSync>()
  for (const r of records) {
    const key = `${r.season}-${r.batSide}-${r.rolling}`
    const existing = map.get(key)
    if (!existing || r.createdAt > existing.syncedAt) {
      map.set(key, {
        season: r.season,
        batSide: r.batSide,
        rolling: r.rolling,
        total: r.total,
        syncedAt: r.createdAt,
      })
    }
  }
  return [...map.values()]
}

export function ParkFactorsSection({
  recentRows,
  heatMaps,
}: {
  recentRows: ParkFactorRow[]
  heatMaps: HeatMapData[]
}) {
  const router = useRouter()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" })
  const [syncSeason, setSyncSeason] = useState(CURRENT_YEAR)
  const [syncBatSide, setSyncBatSide] = useState<"" | "R" | "L">("")
  const [syncRolling, setSyncRolling] = useState<1 | 2 | 3>(3)

  const [syncs, setSyncs] = useState<GroupedSync[]>([])
  const [syncsLoading, setSyncsLoading] = useState(false)
  const [sortCol, setSortCol] = useState<SortCol>("syncedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const availableSeasons = [...new Set(recentRows.map((r) => r.season))].sort(
    (a, b) => b - a,
  )

  const [filterSeason, setFilterSeason] = useState(
    () => availableSeasons[0]?.toString() ?? "",
  )
  const [filterBatSide, setFilterBatSide] = useState("")
  const [filterRolling, setFilterRolling] = useState("3")
  const [heatMapOption, setHeatMapOption] = useState("none")
  const [editForm, setEditForm] = useState<HeatMapData | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })

  const activeHeatMap = heatMaps.find((hm) => hm.name === heatMapOption) ?? null

  function getCellStyle(
    row: DisplayRow,
    columnId: string,
  ): React.CSSProperties | undefined {
    if (columnId === "rank") return CENTERED
    if (!FACTOR_COL_IDS.has(columnId)) return undefined
    if (!activeHeatMap || !HEAT_MAP_COL_IDS.has(columnId)) return CENTERED
    const value = row.factors[columnId]
    if (value === undefined) return CENTERED
    return { ...CENTERED, ...getHeatMapStyle(value, activeHeatMap) }
  }

  const targetRolling = Number(filterRolling)
  const targetSeason = filterSeason ? Number(filterSeason) : null

  const seasonSideRows = recentRows.filter((row) => {
    if (targetSeason !== null && row.season !== targetSeason) return false
    if (row.batSide !== filterBatSide) return false
    return true
  })

  const displayRows = addRanks(applyFallback(seasonSideRows, targetRolling))

  async function fetchSyncs() {
    setSyncsLoading(true)
    try {
      const res = await fetch("/api/admin/park-factors/sync")
      if (res.ok) {
        const data = (await res.json()) as SyncRecord[]
        setSyncs(groupSyncs(data))
      }
    } finally {
      setSyncsLoading(false)
    }
  }

  function openDrawer() {
    setDrawerOpen(true)
    void fetchSyncs()
  }

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
        void fetchSyncs()
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

  function handleClear(g: GroupedSync) {
    setSyncs((prev) =>
      prev.filter(
        (s) =>
          !(
            s.season === g.season &&
            s.batSide === g.batSide &&
            s.rolling === g.rolling
          ),
      ),
    )

    let cancelled = false

    async function execute() {
      if (cancelled) return
      await fetch("/api/admin/park-factors/sync", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: g.season,
          batSide: g.batSide,
          rolling: g.rolling,
        }),
      })
      router.refresh()
    }

    const batSideLabel = g.batSide === "" ? "both" : g.batSide
    showToast({
      title: `Cleared ${g.season} · ${batSideLabel} · ${g.rolling}yr sync`,
      action: {
        label: "Restore",
        onClick: () => {
          cancelled = true
          setSyncs((prev) => [...prev, g])
        },
      },
      onDismiss: () => void execute(),
      onAutoClose: () => void execute(),
    })
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

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  function setColorField(
    side: "minColor" | "maxColor",
    field: keyof OklchColorData,
    value: number,
  ) {
    setEditForm((prev) =>
      prev ? { ...prev, [side]: { ...prev[side], [field]: value } } : prev,
    )
  }

  async function handleSave() {
    if (!editForm) return
    setSaveState({ status: "loading" })
    try {
      const res = await fetch(`/api/admin/heat-maps/${editForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setSaveState({ status: "idle" })
        setHeatMapOption(editForm.name)
        setEditForm(null)
        router.refresh()
      } else {
        const data = (await res.json()) as { error?: string }
        setSaveState({ status: "error", message: data.error ?? "Save failed" })
      }
    } catch {
      setSaveState({ status: "error", message: "Network error" })
    }
  }

  const sortedSyncs = [...syncs].sort((a, b) => {
    const av = a[sortCol]
    const bv = b[sortCol]
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === "asc" ? cmp : -cmp
  })

  return (
    <>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="flex flex-col gap-3">
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-4">
            {recentRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 flex-1">
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

                <FilterGroup
                  label="Rolling Years"
                  options={ROLLING_OPTIONS}
                  value={filterRolling}
                  onChange={setFilterRolling}
                  size="sm"
                />

                <div className="border-l border-border h-6" />

                <div className="flex items-center gap-2">
                  <span className="text-body font-normal text-muted-foreground">
                    Heat Map
                  </span>
                  <Select
                    size="sm"
                    value={heatMapOption}
                    onChange={(e) => setHeatMapOption(e.target.value)}
                  >
                    <option value="none">None</option>
                    {heatMaps.map((hm) => (
                      <option key={hm.name} value={hm.name}>
                        {hm.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    size="sm"
                    mode="icon"
                    onClick={() => {
                      const target = activeHeatMap ?? heatMaps[0]
                      if (target) {
                        setEditForm({
                          ...target,
                          minColor: { ...target.minColor },
                          maxColor: { ...target.maxColor },
                        })
                        setSaveState({ status: "idle" })
                      }
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit heat map</span>
                  </Button>
                </div>

                <div className="border-l border-border h-6" />

                <DrawerTrigger asChild>
                  <Button variant="secondary" size="sm" onClick={openDrawer}>
                    Sync with Savant
                  </Button>
                </DrawerTrigger>
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {recentRows.length === 0 && (
                <DrawerTrigger asChild>
                  <Button variant="secondary" size="sm" onClick={openDrawer}>
                    Sync with Savant
                  </Button>
                </DrawerTrigger>
              )}
              {recentRows.length > 0 && (
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
              )}
            </div>
          </div>

          {/* Table or empty state */}
          {recentRows.length > 0 ? (
            <DataTable
              columns={COLUMNS}
              data={displayRows}
              defaultSorting={[{ id: "index_woba", desc: true }]}
              pagination={false}
              getCellStyle={getCellStyle}
              getHeaderStyle={factorHeaderStyle}
            />
          ) : (
            <p className="body-muted">No park factors synced yet.</p>
          )}
        </div>

        {/* Sync drawer */}
        <DrawerContent>
          <DrawerHeader onClose={() => setDrawerOpen(false)}>
            <DrawerTitle>Sync with Savant</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-6">
            {/* Sync form */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
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
                    onChange={(e) =>
                      setSyncBatSide(e.target.value as "" | "R" | "L")
                    }
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
                  className="min-w-24"
                  variant="secondary"
                  size="sm"
                >
                  {syncState.status === "loading" ? "Syncing…" : "Sync"}
                </Button>
              </div>

              {syncState.status === "loading" && (
                <p className="body-muted">
                  Fetching from Baseball Savant — this may take a moment…
                </p>
              )}
              {syncState.status === "success" && (
                <Alert variant="success">
                  <strong>{syncState.result.upserted.toLocaleString()}</strong>{" "}
                  of <strong>{syncState.result.total.toLocaleString()}</strong>{" "}
                  parks synced for {syncState.result.season} (
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

            {/* Credit */}
            <p className="text-xs text-muted-foreground">
              Park Factors are courtesy Baseball Savant/MLB.
            </p>

            {/* Synced history */}
            {syncsLoading ? (
              <p className="body-muted text-sm">Loading…</p>
            ) : sortedSyncs.length === 0 ? (
              <p className="body-muted text-sm">No syncs yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {(
                      [
                        ["season", "Season"],
                        ["batSide", "Bat Side"],
                        ["rolling", "Rolling"],
                        ["total", "Records"],
                        ["syncedAt", "Synced"],
                      ] as [SortCol, string][]
                    ).map(([col, label]) => (
                      <th
                        key={col}
                        className="pb-2 text-left font-medium text-muted-foreground cursor-pointer select-none"
                        onClick={() => toggleSort(col)}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          <ArrowUpDownIcon
                            className={
                              sortCol === col
                                ? "h-3 w-3 text-foreground"
                                : "h-3 w-3 opacity-30"
                            }
                          />
                        </span>
                      </th>
                    ))}
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedSyncs.map((g) => {
                    const key = `${g.season}-${g.batSide}-${g.rolling}`
                    return (
                      <tr
                        key={key}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2">{g.season}</td>
                        <td className="py-2">
                          {g.batSide === "" ? "Both" : g.batSide}
                        </td>
                        <td className="py-2">{g.rolling}yr</td>
                        <td className="py-2">{g.total.toLocaleString()}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(g.syncedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClear(g)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                            <span className="sr-only">Clear</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Edit heat map drawer */}
      <Drawer open={editForm !== null} onClose={() => setEditForm(null)}>
        <DrawerContent>
          <DrawerHeader onClose={() => setEditForm(null)}>
            <DrawerTitle>Edit Heat Map</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-6">
            {editForm && (
              <>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <Input
                      size="sm"
                      maxLength={24}
                      className="w-60"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev,
                        )
                      }
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        ["min", "Min"],
                        ["max", "Max"],
                        ["avg", "Avg"],
                        ["increments", "Increments"],
                      ] as [keyof HeatMapData, string][]
                    ).map(([field, label]) => (
                      <label
                        key={field}
                        className="flex flex-col gap-1 text-sm"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <Input
                          size="sm"
                          type="number"
                          className="w-[90px]"
                          value={editForm[field] as number}
                          onChange={(e) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, [field]: Number(e.target.value) }
                                : prev,
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={editForm.isPivot}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, isPivot: e.target.checked } : prev,
                        )
                      }
                    />
                    <span>Pivot at avg</span>
                  </label>
                </div>

                {(
                  [
                    ["minColor", "Min Color"],
                    ["maxColor", "Max Color"],
                  ] as ["minColor" | "maxColor", string][]
                ).map(([side, label]) => (
                  <div key={side} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      <div
                        className="h-5 w-5 rounded border border-border"
                        style={{
                          backgroundColor: toOklch(editForm[side]),
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(
                        [
                          ["lightness", "Lightness", 0, 1, 0.001],
                          ["chroma", "Chroma", 0, 0.4, 0.001],
                          ["hue", "Hue", 0, 360, 0.001],
                          ["alpha", "Alpha", 0, 1, 0.001],
                        ] as [keyof OklchColorData, string, number, number, number][]
                      ).map(([field, fieldLabel, min, max, step]) => (
                        <label
                          key={field}
                          className="flex flex-col gap-1 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {fieldLabel}
                          </span>
                          <Input
                            size="sm"
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            className="w-[100px]"
                            value={editForm[side][field] as number}
                            onChange={(e) =>
                              setColorField(side, field, Number(e.target.value))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {saveState.status === "error" && (
                  <Alert variant="error">{saveState.message}</Alert>
                )}
              </>
            )}
          </DrawerBody>
          <DrawerFooter className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditForm(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveState.status === "loading"}
            >
              {saveState.status === "loading" ? "Saving…" : "Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
