"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  CopyPlusIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  MoonIcon,
  PencilIcon,
  SunIcon,
  Trash2Icon,
  Undo2Icon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { type ReactNode, useRef, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { DataTable } from "@/components/data-table"
import { FilterGroup } from "@/components/filter-group"
import { type Theme, useTheme } from "@/components/theme-provider"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorInput, type ColorSpace } from "@/components/ui/color-input"
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
import {
  EditInPlace,
  type EditInPlaceHandle,
} from "@/components/ui/edit-in-place"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { showToast } from "@/components/ui/sonner"
import { hexToOklch, oklchToHex } from "@/lib/color"
import { triggerCsvDownload } from "@/lib/csv"
import {
  BBQ_DEFAULT,
  getConfigForTheme,
  getHeatMapStyle,
  getStepColor,
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

const LIMIT_FIELDS: {
  field: "max" | "min" | "avg" | "increments"
  label: string
  className: string
  min?: number
  max?: number
  step?: number
  displayOffset?: number
}[] = [
  { field: "max", label: "Max", className: "w-20" },
  { field: "min", label: "Min", className: "w-20" },
  { field: "avg", label: "Avg", className: "w-20" },
  {
    field: "increments",
    label: "Count",
    className: "w-16",
    min: 2,
    displayOffset: 1,
  },
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
        if (v === undefined) return "—"
        return key === "pa" ? PA_FMT.format(v) : v.toFixed(0)
      },
    }),
  ),
]

const PA_FMT = new Intl.NumberFormat("en-US")

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

function cloneHeatMap(hm: HeatMapData): HeatMapData {
  return {
    ...hm,
    minColor: { ...hm.minColor },
    avgColor: { ...hm.avgColor },
    maxColor: { ...hm.maxColor },
    minDarkColor: { ...hm.minDarkColor },
    avgDarkColor: { ...hm.avgDarkColor },
    maxDarkColor: { ...hm.maxDarkColor },
  }
}

export function ParkFactorsSection({
  recentRows,
  heatMaps,
}: {
  recentRows: ParkFactorRow[]
  heatMaps: HeatMapData[]
}) {
  const router = useRouter()
  const { isDark, setTheme, theme } = useTheme()
  const preEditThemeRef = useRef<Theme>(theme)
  const preCopyFormRef = useRef<HeatMapData | null>(null)
  const editInPlaceRef = useRef<EditInPlaceHandle>(null)
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
  const [heatMapOption, setHeatMapOption] = useState(
    heatMaps[0]?.name ?? "none",
  )
  const [editForm, setEditForm] = useState<HeatMapData | null>(null)
  const initialEditFormRef = useRef<HeatMapData | null>(null)
  const [editMode, setEditMode] = useState<"light" | "dark">("light")
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [colorSpace, setColorSpace] = useState<ColorSpace>("oklch")
  const [activePicker, setActivePicker] = useState<
    "min" | "max" | "avg" | null
  >(null)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(
    () => new Set(),
  )

  const visibleHeatMaps = heatMaps.filter((hm) => !pendingDeleteIds.has(hm.id))

  const activeHeatMap =
    visibleHeatMaps.find((hm) => hm.name === heatMapOption) ?? null
  const displayHeatMap = previewEnabled && editForm ? editForm : activeHeatMap
  const adjustedDisplayHeatMap = displayHeatMap
    ? getConfigForTheme(displayHeatMap, isDark)
    : null

  const minKey = editMode === "dark" ? "minDarkColor" : "minColor"
  const avgKey = editMode === "dark" ? "avgDarkColor" : "avgColor"
  const maxKey = editMode === "dark" ? "maxDarkColor" : "maxColor"
  const curveKey = editMode === "dark" ? "curveDark" : "curve"

  const panelConfig = editForm
    ? getConfigForTheme(editForm, editMode === "dark")
    : null

  // What the undo arrows / "Clear" button revert to. A new copy reverts to its
  // origin (the map it was copied from) with the copy's "… Copy" name; Default
  // reverts to the factory BBQ_DEFAULT; a saved map reverts to its loaded state.
  function getEditBaseline(): HeatMapData | null {
    if (!editForm) return null
    if (editForm.id === -1) {
      const origin = preCopyFormRef.current
      return origin ? { ...origin, id: -1, name: `${origin.name} Copy` } : null
    }
    if (editForm.name === "Default") {
      return { ...BBQ_DEFAULT, id: editForm.id, name: "Default" }
    }
    return initialEditFormRef.current
  }
  const editBaseline = getEditBaseline()

  // Dirty = unsaved edits since the map was loaded. Compared against the
  // loaded/saved state (not editBaseline, which for Default is the factory
  // BBQ_DEFAULT), so saved Default overrides do not count as changes.
  function isDirtyFromSaved(form: HeatMapData): boolean {
    const saved = initialEditFormRef.current
    return saved !== null && isAnyDirty(form, saved)
  }

  function loadEditForm(target: HeatMapData) {
    const formState = cloneHeatMap(target)
    initialEditFormRef.current = formState
    setEditForm(formState)
    preCopyFormRef.current = null
    setSaveState({ status: "idle" })
  }

  function handleSwitchMap(name: string) {
    const target = visibleHeatMaps.find((hm) => hm.name === name)
    if (target) loadEditForm(target)
  }

  const switchDisabled =
    !editForm || editForm.id === -1 || isDirtyFromSaved(editForm)

  // Sync edit-in-place's in-progress name into the form, so a mid-edit rename is
  // captured before copying or saving (shared by handleCopy and handleSave).
  function commitLiveName(form: HeatMapData): HeatMapData {
    const liveName = editInPlaceRef.current?.getCurrentValue()
    editInPlaceRef.current?.commit()
    return liveName !== undefined ? { ...form, name: liveName } : form
  }

  // Exit copy mode by restoring the origin the copy was made from.
  function restorePreCopy() {
    if (preCopyFormRef.current) {
      setEditForm(preCopyFormRef.current)
      preCopyFormRef.current = null
    }
  }

  function handleCopy() {
    if (!editForm) return
    // The copy carries the origin's in-progress name into its "name + copy".
    const origin = commitLiveName(editForm)
    const dirty = isDirtyFromSaved(origin)
    preCopyFormRef.current = origin
    setEditForm({ ...origin, id: -1, name: `${origin.name} Copy` })
    if (dirty) {
      showToast({
        title: "Your changes will be applied to the new heat map.",
        action: {
          label: "Go back",
          icon: <Undo2Icon className="h-3.5 w-3.5" />,
          onClick: restorePreCopy,
        },
      })
    }
  }

  function handleDeleteHeatMap(target: HeatMapData) {
    setPendingDeleteIds((prev) => new Set(prev).add(target.id))
    setHeatMapOption((prev) => (prev === target.name ? "none" : prev))

    let cancelled = false
    let executed = false

    function removePending() {
      setPendingDeleteIds((prev) => {
        const next = new Set(prev)
        next.delete(target.id)
        return next
      })
    }

    async function execute() {
      if (executed || cancelled) return
      executed = true
      const res = await fetch(`/api/admin/heat-maps/${target.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.refresh()
        // Delete committed: if the drawer is still open on the now-gone map,
        // return it to the Default heat map.
        const defaultMap = heatMaps.find((hm) => hm.name === "Default")
        if (defaultMap) {
          const formState = cloneHeatMap(defaultMap)
          initialEditFormRef.current = formState
          preCopyFormRef.current = null
          setSaveState({ status: "idle" })
          setEditForm((prev) => (prev ? formState : prev))
        }
      } else {
        removePending()
        showToast.error(`Failed to delete the ${target.name} heat map.`)
      }
    }

    showToast({
      title: `You have deleted the ${target.name} heat map.`,
      action: {
        label: "Restore",
        onClick: () => {
          cancelled = true
          removePending()
        },
      },
      onDismiss: execute,
      onAutoClose: execute,
    })
  }

  function handleEditModeChange(mode: "light" | "dark") {
    setEditMode(mode)
    if (previewEnabled) setTheme(mode)
  }

  function handleEditFormClose() {
    setEditForm(null)
    setActivePicker(null)
    preCopyFormRef.current = null
    initialEditFormRef.current = null
    if (previewEnabled) setTheme(preEditThemeRef.current)
  }

  const syncButton = (
    <DrawerTrigger asChild>
      <Button variant="secondary" size="sm" onClick={openDrawer}>
        Sync with Savant
      </Button>
    </DrawerTrigger>
  )

  function getCellStyle(
    row: DisplayRow,
    columnId: string,
  ): React.CSSProperties | undefined {
    if (columnId === "rank") return CENTERED
    if (!FACTOR_COL_IDS.has(columnId)) return undefined
    if (!adjustedDisplayHeatMap || !HEAT_MAP_COL_IDS.has(columnId))
      return CENTERED
    const value = row.factors[columnId]
    if (value === undefined) return CENTERED
    return {
      ...CENTERED,
      ...getHeatMapStyle(value, adjustedDisplayHeatMap),
    }
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

  async function handleSave() {
    if (!editForm) return
    setSaveState({ status: "loading" })
    const formToSave = commitLiveName(editForm)
    const isNew = formToSave.id === -1
    try {
      const res = await fetch(
        isNew
          ? "/api/admin/heat-maps"
          : `/api/admin/heat-maps/${formToSave.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToSave),
        },
      )
      if (res.ok) {
        setSaveState({ status: "idle" })
        setHeatMapOption(formToSave.name)
        setEditForm(null)
        preCopyFormRef.current = null
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
                  <label className="flex items-center gap-2 text-body font-normal text-muted-foreground">
                    Season
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
                  </label>
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
                  {visibleHeatMaps.length === 1 ? (
                    <label className="flex items-center gap-2 cursor-pointer text-body font-normal text-muted-foreground">
                      <Checkbox
                        size="sm"
                        checked={heatMapOption !== "none"}
                        onChange={(e) =>
                          setHeatMapOption(
                            e.target.checked ? visibleHeatMaps[0].name : "none",
                          )
                        }
                      />
                      Heat Map
                    </label>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-body font-normal text-muted-foreground">
                      <Checkbox
                        size="sm"
                        checked={heatMapOption !== "none"}
                        onChange={(e) =>
                          setHeatMapOption(
                            e.target.checked
                              ? heatMapOption !== "none"
                                ? heatMapOption
                                : (visibleHeatMaps[0]?.name ?? "none")
                              : "none",
                          )
                        }
                      />
                      Heat Map
                      <Select
                        size="sm"
                        value={
                          heatMapOption !== "none"
                            ? heatMapOption
                            : (visibleHeatMaps[0]?.name ?? "")
                        }
                        onChange={(e) => setHeatMapOption(e.target.value)}
                      >
                        {visibleHeatMaps.map((hm) => (
                          <option key={hm.name} value={hm.name}>
                            {hm.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    mode="icon"
                    onClick={() => {
                      const target = activeHeatMap ?? visibleHeatMaps[0]
                      if (target) {
                        preEditThemeRef.current = theme
                        setEditMode(isDark ? "dark" : "light")
                        loadEditForm(target)
                        setColorSpace("oklch")
                      }
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit heat map</span>
                  </Button>
                </div>

                <div className="border-l border-border h-6" />

                {syncButton}
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {recentRows.length === 0 && syncButton}
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
      <Drawer open={editForm !== null} onClose={handleEditFormClose}>
        <DrawerContent>
          <DrawerHeader onClose={handleEditFormClose}>
            <div className="flex items-center gap-3">
              <DrawerTitle>Edit Heat Map</DrawerTitle>
              {editForm && visibleHeatMaps.length > 1 && (
                <Select
                  size="sm"
                  value={editForm.name}
                  disabled={switchDisabled}
                  onChange={(e) => handleSwitchMap(e.target.value)}
                  aria-label="Switch heat map"
                >
                  {!visibleHeatMaps.some((hm) => hm.name === editForm.name) && (
                    <option value={editForm.name}>{editForm.name}</option>
                  )}
                  {visibleHeatMaps.map((hm) => (
                    <option key={hm.name} value={hm.name}>
                      {hm.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-5">
            {editForm && (
              <>
                {/* Name + Copy/Revert */}
                <div className="flex items-center justify-between">
                  {editForm.name === "Default" ? (
                    <h2 className="text-xl font-semibold">{editForm.name}</h2>
                  ) : (
                    <div className="flex items-center gap-2">
                      <EditInPlace
                        ref={editInPlaceRef}
                        value={editForm.name}
                        maxLength={24}
                        className="text-xl font-semibold"
                        onChange={(name) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, name } : prev,
                          )
                        }
                      />
                      {editBaseline && editForm.name !== editBaseline.name && (
                        <IconButton
                          onClick={() =>
                            setEditForm((prev) =>
                              prev && editBaseline
                                ? { ...prev, name: editBaseline.name }
                                : prev,
                            )
                          }
                          aria-label="Reset name"
                          className="shrink-0"
                        >
                          <Undo2Icon />
                        </IconButton>
                      )}
                    </div>
                  )}
                  <DropdownMenu modal={false} size="sm">
                    <DropdownMenuTrigger asChild>
                      <IconButton aria-label="Heat map actions">
                        <EllipsisVerticalIcon />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {editForm.id === -1 ? (
                        <DropdownMenuItem onSelect={restorePreCopy}>
                          <XIcon className="h-3.5 w-3.5" />
                          Cancel
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem onSelect={handleCopy}>
                            <CopyPlusIcon className="h-3.5 w-3.5" />
                            Copy
                          </DropdownMenuItem>
                          {editForm.name !== "Default" && (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => handleDeleteHeatMap(editForm)}
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {editForm.id === -1 && (
                  <Alert variant="warning">
                    This new heat map is not saved until you submit the form
                    with the Save button.
                  </Alert>
                )}

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-body font-normal text-muted-foreground">
                    Color Space
                    <Select
                      size="sm"
                      value={colorSpace}
                      onChange={(e) =>
                        setColorSpace(e.target.value as ColorSpace)
                      }
                    >
                      <option value="oklch">OKLCH</option>
                      <option value="rgb">RGB</option>
                      <option value="hex">Hex</option>
                    </Select>
                  </label>
                  <div className="flex items-center gap-2">
                    <FilterGroup
                      label="Mode"
                      options={[
                        {
                          value: "light",
                          label: <SunIcon className="h-3.5 w-3.5" />,
                        },
                        {
                          value: "dark",
                          label: <MoonIcon className="h-3.5 w-3.5" />,
                        },
                      ]}
                      value={editMode}
                      onChange={(v) =>
                        handleEditModeChange(v as "light" | "dark")
                      }
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3>Limits</h3>
                  <div className="flex flex-wrap gap-3">
                    {LIMIT_FIELDS.map(
                      ({
                        field,
                        label,
                        className,
                        min,
                        max,
                        step,
                        displayOffset = 0,
                      }) => {
                        const baselineVal = editBaseline
                          ? (editBaseline[field] as number)
                          : null
                        const dirty =
                          baselineVal !== null &&
                          editForm[field] !== baselineVal
                        return (
                          <FieldWithUndo
                            key={field}
                            dirty={dirty}
                            onUndo={() =>
                              setEditForm((prev) =>
                                prev && baselineVal !== null
                                  ? { ...prev, [field]: baselineVal }
                                  : prev,
                              )
                            }
                          >
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-muted-foreground">
                                {label}
                              </span>
                              <Input
                                size="sm"
                                type="number"
                                min={min}
                                max={max}
                                step={step ?? 1}
                                className={className}
                                value={
                                  (editForm[field] as number) + displayOffset
                                }
                                onChange={(e) => {
                                  let stored =
                                    Number(e.target.value) - displayOffset
                                  if (field === "increments")
                                    stored = Math.max(1, stored)
                                  setEditForm((prev) =>
                                    prev ? { ...prev, [field]: stored } : prev,
                                  )
                                }}
                              />
                            </label>
                          </FieldWithUndo>
                        )
                      },
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3>Colors</h3>
                  <div className="flex gap-3">
                    {/* Gradient strip column — top spacer aligns boxes with input fields */}
                    <div className="flex flex-col shrink-0 w-14">
                      <div style={{ height: LABEL_HEIGHT }} />
                      <GradientColorBox
                        value={editForm.max}
                        config={panelConfig ?? editForm}
                        label="Max"
                        isOpen={activePicker === "max"}
                        onOpenChange={(open) =>
                          setActivePicker(open ? "max" : null)
                        }
                        pickerColor={editForm[maxKey]}
                        onPickerChange={(c) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, [maxKey]: c } : prev,
                          )
                        }
                      />
                      <GradientSection
                        config={panelConfig ?? editForm}
                        side="above"
                      />
                      <GradientColorBox
                        value={editForm.avg}
                        config={panelConfig ?? editForm}
                        label="Avg"
                        transparent={editForm.increments === 1}
                        isOpen={activePicker === "avg"}
                        onOpenChange={(open) =>
                          setActivePicker(open ? "avg" : null)
                        }
                        pickerColor={
                          editForm.increments === 1
                            ? undefined
                            : editForm[avgKey]
                        }
                        onPickerChange={(c) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, [avgKey]: c } : prev,
                          )
                        }
                      />
                      <GradientSection
                        config={panelConfig ?? editForm}
                        side="below"
                      />
                      <GradientColorBox
                        value={editForm.min}
                        config={panelConfig ?? editForm}
                        label="Min"
                        isOpen={activePicker === "min"}
                        onOpenChange={(open) =>
                          setActivePicker(open ? "min" : null)
                        }
                        pickerColor={editForm[minKey]}
                        onPickerChange={(c) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, [minKey]: c } : prev,
                          )
                        }
                      />
                    </div>

                    {/* Color inputs column — SPACER_HEIGHT gaps keep inputs in sync with boxes */}
                    <div className="flex flex-col">
                      <FieldWithUndo
                        dirty={
                          editBaseline !== null &&
                          isColorDirty(editForm[maxKey], editBaseline[maxKey])
                        }
                        onUndo={() =>
                          setEditForm((prev) =>
                            prev && editBaseline
                              ? {
                                  ...prev,
                                  [maxKey]: { ...editBaseline[maxKey] },
                                }
                              : prev,
                          )
                        }
                      >
                        <ColorInput
                          colorSpace={colorSpace}
                          value={editForm[maxKey]}
                          onChange={(v) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, [maxKey]: v } : prev,
                            )
                          }
                          size="sm"
                        />
                      </FieldWithUndo>

                      <div style={{ height: SPACER_HEIGHT }} />

                      <div
                        className={`flex items-end${editForm.increments === 1 ? " opacity-50 pointer-events-none" : ""}`}
                      >
                        <div
                          className={`pr-3 transition-[max-width,opacity] duration-400 ${editForm.isPivot ? "overflow-visible" : "overflow-hidden"}`}
                          style={{
                            maxWidth: editForm.isPivot ? 500 : 0,
                            opacity: editForm.isPivot ? 1 : 0,
                          }}
                        >
                          <ColorInput
                            colorSpace={colorSpace}
                            value={editForm[avgKey]}
                            onChange={(v) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, [avgKey]: v } : prev,
                              )
                            }
                            size="sm"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-body font-normal text-muted-foreground mb-1.5 cursor-pointer">
                          <Checkbox
                            size="sm"
                            checked={editForm.isPivot}
                            disabled={editForm.increments === 1}
                            className={
                              editForm.increments === 1
                                ? "disabled:opacity-100"
                                : undefined
                            }
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, isPivot: e.target.checked }
                                  : prev,
                              )
                            }
                          />
                          Pivot
                        </label>

                        {editBaseline !== null &&
                          (isColorDirty(
                            editForm[avgKey],
                            editBaseline[avgKey],
                          ) ||
                            editForm.isPivot !== editBaseline.isPivot) && (
                            <IconButton
                              onClick={() =>
                                setEditForm((prev) =>
                                  prev && editBaseline
                                    ? {
                                        ...prev,
                                        [avgKey]: { ...editBaseline[avgKey] },
                                        isPivot: editBaseline.isPivot,
                                      }
                                    : prev,
                                )
                              }
                              aria-label="Reset to default"
                              className="mb-1 ml-1 shrink-0"
                            >
                              <Undo2Icon />
                            </IconButton>
                          )}
                      </div>

                      <div style={{ height: SPACER_HEIGHT }} />

                      <FieldWithUndo
                        dirty={
                          editBaseline !== null &&
                          isColorDirty(editForm[minKey], editBaseline[minKey])
                        }
                        onUndo={() =>
                          setEditForm((prev) =>
                            prev && editBaseline
                              ? {
                                  ...prev,
                                  [minKey]: { ...editBaseline[minKey] },
                                }
                              : prev,
                          )
                        }
                      >
                        <ColorInput
                          colorSpace={colorSpace}
                          value={editForm[minKey]}
                          onChange={(v) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, [minKey]: v } : prev,
                            )
                          }
                          size="sm"
                        />
                      </FieldWithUndo>
                    </div>
                  </div>
                  <FieldWithUndo
                    dirty={
                      editBaseline !== null &&
                      editForm[curveKey] !== editBaseline[curveKey]
                    }
                    onUndo={() =>
                      setEditForm((prev) =>
                        prev && editBaseline
                          ? { ...prev, [curveKey]: editBaseline[curveKey] }
                          : prev,
                      )
                    }
                  >
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-muted-foreground">Curve</span>
                      <Input
                        size="sm"
                        type="number"
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="w-16"
                        value={editForm[curveKey]}
                        onChange={(e) => {
                          const stored = Math.max(
                            0.1,
                            Math.min(10, Number(e.target.value)),
                          )
                          setEditForm((prev) =>
                            prev ? { ...prev, [curveKey]: stored } : prev,
                          )
                        }}
                      />
                    </label>
                  </FieldWithUndo>
                </div>

                {/* Preview */}
                <label className="flex cursor-pointer items-center gap-2 text-body font-normal text-muted-foreground">
                  <Checkbox
                    size="sm"
                    checked={previewEnabled}
                    onChange={(e) => setPreviewEnabled(e.target.checked)}
                  />
                  Preview
                </label>

                {saveState.status === "error" && (
                  <Alert variant="error">{saveState.message}</Alert>
                )}
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            <div className="flex w-full items-center justify-between">
              {editForm &&
              editBaseline &&
              isAnyDirty(editForm, editBaseline) ? (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() =>
                    setEditForm((prev) =>
                      prev && editBaseline
                        ? {
                            ...prev,
                            name: editBaseline.name,
                            min: editBaseline.min,
                            max: editBaseline.max,
                            avg: editBaseline.avg,
                            increments: editBaseline.increments,
                            isPivot: editBaseline.isPivot,
                            curve: editBaseline.curve,
                            curveDark: editBaseline.curveDark,
                            minColor: { ...editBaseline.minColor },
                            avgColor: { ...editBaseline.avgColor },
                            maxColor: { ...editBaseline.maxColor },
                            minDarkColor: { ...editBaseline.minDarkColor },
                            avgDarkColor: { ...editBaseline.avgDarkColor },
                            maxDarkColor: { ...editBaseline.maxDarkColor },
                          }
                        : prev,
                    )
                  }
                >
                  <Undo2Icon className="h-3.5 w-3.5" />
                  {editForm.name === "Default"
                    ? "Clear Overrides"
                    : "Clear Changes"}
                  {hasLightColorOverrides(editForm, editBaseline) && (
                    <SunIcon className="h-3.5 w-3.5" />
                  )}
                  {hasDarkColorOverrides(editForm, editBaseline) && (
                    <MoonIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEditFormClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveState.status === "loading"}
                >
                  {saveState.status === "loading" ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function FieldWithUndo({
  dirty,
  onUndo,
  children,
}: {
  dirty: boolean
  onUndo: () => void
  children: ReactNode
}) {
  return (
    <div className="flex items-end gap-1">
      {children}
      {dirty && (
        <IconButton
          onClick={onUndo}
          aria-label="Reset to default"
          className="mb-1 shrink-0"
        >
          <Undo2Icon />
        </IconButton>
      )}
    </div>
  )
}

// ── Gradient components ───────────────────────────────────────────────────────

// text-xs line-height (16px) + gap-1 (4px) = 20px — matches InputFieldGroup label row
const LABEL_HEIGHT = 20
const STRIP_TOTAL = 64
const BLOCK_HEIGHT = STRIP_TOTAL / 2
// Spacer between color inputs so each input's h-8 field aligns with the corresponding color box
const SPACER_HEIGHT = STRIP_TOTAL - LABEL_HEIGHT
const MIN_SLICE = 4
const MAX_SLICES = Math.floor(STRIP_TOTAL / MIN_SLICE)

function computeSlices(count: number): { indices: number[]; height: number } {
  if (count <= 0) return { indices: [], height: 0 }
  const rawHeight = STRIP_TOTAL / count
  const height = Math.min(rawHeight, BLOCK_HEIGHT)
  if (rawHeight >= MIN_SLICE) {
    return {
      indices: Array.from({ length: count }, (_, i) => i),
      height,
    }
  }
  const step = (count - 1) / (MAX_SLICES - 1)
  const indices = Array.from({ length: MAX_SLICES }, (_, i) =>
    Math.round(i * step),
  )
  return { indices, height: Math.min(STRIP_TOTAL / MAX_SLICES, BLOCK_HEIGHT) }
}

function GradientColorBox({
  value,
  config,
  label,
  transparent,
  isOpen,
  onOpenChange,
  pickerColor,
  onPickerChange,
}: {
  value: number
  config: HeatMapData
  label: string
  transparent?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  pickerColor?: OklchColorData
  onPickerChange?: (c: OklchColorData) => void
}) {
  const interactive = pickerColor !== undefined && onOpenChange !== undefined

  const box = (
    <div
      className={`flex items-center justify-center shrink-0 w-14 h-8 text-xs font-medium select-none${interactive ? " cursor-pointer" : ""}${isOpen ? " ring-2 ring-foreground/20 ring-inset" : ""}`}
      style={transparent ? {} : getHeatMapStyle(value, config)}
    >
      {transparent ? null : label}
    </div>
  )

  if (!interactive) return box

  const hexValue = oklchToHex(pickerColor)

  function handleChange(hex: string) {
    const next = hexToOklch(hex)
    if (next && onPickerChange && pickerColor)
      onPickerChange({ ...next, alpha: pickerColor.alpha })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="block"
      >
        {box}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 shadow-lg rounded-lg overflow-hidden">
            <HexColorPicker color={hexValue} onChange={handleChange} />
          </div>
        </>
      )}
    </div>
  )
}

function GradientSection({
  config,
  side,
}: {
  config: HeatMapData
  side: "above" | "below"
}) {
  const { min, max, avg, increments } = config
  const stepSize = (max - min) / increments
  const stepsToAvg = Math.round((avg - min) / stepSize)
  const stepsFromAvg = increments - stepsToAvg
  const maxStep = increments

  const count =
    side === "above"
      ? Math.max(0, stepsFromAvg - 1)
      : Math.max(0, stepsToAvg - 1)
  const { indices, height } = computeSlices(count)

  return (
    <div className="w-14" style={{ height: STRIP_TOTAL }}>
      {indices.map((relIdx) => {
        const step =
          side === "above" ? maxStep - 1 - relIdx : stepsToAvg - 1 - relIdx
        return (
          <div
            key={step}
            style={{
              height,
              backgroundColor: toOklch(getStepColor(step, config)),
            }}
          />
        )
      })}
    </div>
  )
}

// ── Dirty helpers ─────────────────────────────────────────────────────────────

function isColorDirty(a: OklchColorData, b: OklchColorData): boolean {
  return (
    a.lightness !== b.lightness ||
    a.chroma !== b.chroma ||
    a.hue !== b.hue ||
    a.alpha !== b.alpha
  )
}

function hasLightColorOverrides(
  form: HeatMapData,
  baseline: HeatMapData,
): boolean {
  return (
    isColorDirty(form.minColor, baseline.minColor) ||
    isColorDirty(form.avgColor, baseline.avgColor) ||
    isColorDirty(form.maxColor, baseline.maxColor)
  )
}

function hasDarkColorOverrides(
  form: HeatMapData,
  baseline: HeatMapData,
): boolean {
  return (
    isColorDirty(form.minDarkColor, baseline.minDarkColor) ||
    isColorDirty(form.avgDarkColor, baseline.avgDarkColor) ||
    isColorDirty(form.maxDarkColor, baseline.maxDarkColor)
  )
}

function isAnyDirty(form: HeatMapData, baseline: HeatMapData): boolean {
  return (
    form.name !== baseline.name ||
    form.min !== baseline.min ||
    form.max !== baseline.max ||
    form.avg !== baseline.avg ||
    form.increments !== baseline.increments ||
    form.isPivot !== baseline.isPivot ||
    form.curve !== baseline.curve ||
    form.curveDark !== baseline.curveDark ||
    hasLightColorOverrides(form, baseline) ||
    hasDarkColorOverrides(form, baseline)
  )
}
