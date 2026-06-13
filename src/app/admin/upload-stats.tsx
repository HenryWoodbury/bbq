"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Trash2Icon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type CSSProperties, useEffect, useRef, useState } from "react"
import { DataTable } from "@/components/data-table"
import { DropZoneOverlay } from "@/components/drop-zone-overlay"
import { FilterGroup } from "@/components/filter-group"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/field"
import { FileLabel } from "@/components/ui/file-label"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useFileDrop } from "@/hooks/use-file-drop"
import { useOptimisticDelete } from "@/hooks/use-optimistic-delete"
import {
  inferStatsRow,
  type PendingRow,
  type PlayerType,
  type Projection,
  type Split,
  type StatType,
} from "@/lib/infer-stats-row"
import {
  PROJECTION_DISPLAY,
  PROJECTION_OPTIONS,
  SPLIT_DISPLAY,
  SPLIT_NORM,
  SPLIT_OPTIONS,
} from "@/lib/stat-labels"
import { cn } from "@/lib/utils"
import type { StatUploadRow } from "./players/page"

const CURRENT_YEAR = new Date().getFullYear()
// amber-500, amber-400, amber-300 in hex
const MATCH_COLOR_HEX = ["#f59e0b", "#fbbf24", "#fcd34d"] as const

function specKey(r: {
  season: number
  playerType: string
  projection: string
  split: string
}) {
  return `${r.season}|${r.playerType}|${r.projection}|${r.split}`
}

function matchGradient(hex: string) {
  return `linear-gradient(to right, ${hex} 10px, transparent 10px)`
}

function buildStatsBody(
  file: File,
  opts: {
    season: number
    playerType: string
    projection: string
    split: string
  },
): FormData {
  const body = new FormData()
  body.append("file", file)
  body.append("fileName", file.name)
  body.append("season", String(opts.season))
  body.append("playerType", opts.playerType)
  if (opts.projection !== "None") {
    body.append("projection", opts.projection)
    body.append("split", opts.split)
  }
  return body
}

export function UploadStats({
  existingUploads,
  onDelete,
  className,
}: {
  existingUploads: StatUploadRow[]
  onDelete: (id: string) => Promise<void>
  className?: string
}) {
  const router = useRouter()
  const dismissTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([])
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set())
  const { pendingDeleteIds, scheduleDelete } = useOptimisticDelete<string>({
    getId: (id) => id,
    title: "Upload removed.",
    variant: "warning",
    perform: async (id) => {
      try {
        await onDelete(id)
        return true
      } catch {
        return false
      }
    },
  })

  useEffect(
    () => () => {
      dismissTimers.current.forEach(clearTimeout)
    },
    [],
  )

  const visibleExisting = existingUploads.filter(
    (u) => !pendingDeleteIds.has(u.id),
  )

  // Build spec-key → hex map. Pending splits are snake_case; normalize to Prisma PascalCase.
  const specToHex = new Map<string, string>()
  for (let i = 0; i < pendingRows.length; i++) {
    const row = pendingRows[i]
    const k = specKey({ ...row, split: SPLIT_NORM[row.split] ?? row.split })
    if (!specToHex.has(k))
      specToHex.set(k, MATCH_COLOR_HEX[i % MATCH_COLOR_HEX.length])
  }
  const existingSpecKeys = new Set(visibleExisting.map(specKey))

  function getCellStyle(
    upload: StatUploadRow,
    columnId: string,
  ): CSSProperties | undefined {
    if (columnId !== "file") return undefined
    const hex = specToHex.get(specKey(upload))
    return hex ? { background: matchGradient(hex) } : undefined
  }

  function addFiles(files: File[]) {
    setPendingRows((prev) => [
      ...prev,
      ...files.map((f) => inferStatsRow(f, CURRENT_YEAR)),
    ])
  }

  function patchRow(id: string, patch: Partial<PendingRow>) {
    setPendingRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }

  function removeRow(id: string) {
    setPendingRows((prev) => prev.filter((r) => r.id !== id))
  }

  function triggerDismiss(id: string, callback: () => void) {
    setDismissingIds((prev) => new Set(prev).add(id))
    const tid = setTimeout(() => {
      dismissTimers.current.delete(tid)
      callback()
    }, 150)
    dismissTimers.current.add(tid)
  }

  async function handleSaveAll() {
    await Promise.all(pendingRows.map((row) => handleSaveRow(row.id)))
  }

  const { isDragging } = useFileDrop(addFiles, ".csv")

  async function handleSaveRow(id: string) {
    const row = pendingRows.find((r) => r.id === id)
    if (!row) return
    patchRow(id, { saving: true, error: null })
    try {
      const res = await fetch("/api/admin/upload-stats", {
        method: "POST",
        body: buildStatsBody(row.file, row),
      })
      const data = (await res.json()) as { error?: string }
      if (res.ok) {
        triggerDismiss(id, () => {
          removeRow(id)
          router.refresh()
        })
      } else {
        patchRow(id, { saving: false, error: data.error ?? "Upload failed" })
      }
    } catch {
      patchRow(id, { saving: false, error: "Network error" })
    }
  }

  const columns: ColumnDef<StatUploadRow>[] = [
    {
      id: "file",
      accessorFn: (row) => row.fileName ?? "",
      header: "File",
      size: 240,
      cell: ({ row }) => (
        <span className="truncate">{row.original.fileName ?? "—"}</span>
      ),
    },
    {
      accessorKey: "season",
      header: "Season",
      size: 80,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.season}</span>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.playerType,
      header: "Role",
      size: 80,
      cell: ({ row }) =>
        row.original.playerType === "BATTER" ? "Batter" : "Pitcher",
    },
    {
      id: "type",
      accessorFn: (row) => (row.projection === "None" ? "Actual" : "Projected"),
      header: "Type",
      size: 80,
      cell: ({ row }) =>
        row.original.projection === "None" ? "Actual" : "Projected",
    },
    {
      id: "model",
      accessorFn: (row) =>
        row.projection !== "None"
          ? (PROJECTION_DISPLAY[row.projection] ?? row.projection)
          : "",
      header: "Model",
      size: 80,
      cell: ({ row }) =>
        row.original.projection !== "None"
          ? (PROJECTION_DISPLAY[row.original.projection] ??
            row.original.projection)
          : "",
    },
    {
      id: "split",
      accessorFn: (row) => SPLIT_DISPLAY[row.split] ?? row.split,
      header: "Split",
      size: 80,
      cell: ({ row }) =>
        SPLIT_DISPLAY[row.original.split] ?? row.original.split,
    },
    {
      id: "actions",
      header: "",
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <IconButton
            aria-label="Delete upload"
            onClick={() => scheduleDelete(row.original.id)}
          >
            <Trash2Icon />
          </IconButton>
        </div>
      ),
    },
  ]

  const hasExisting = visibleExisting.length > 0
  const hasPending = pendingRows.length > 0

  return (
    <>
      <DropZoneOverlay visible={isDragging} />

      <div className={cn("flex flex-col text-sm", className)}>
        {hasExisting && (
          <DataTable
            columns={columns}
            data={visibleExisting}
            pagination={false}
            defaultSorting={[{ id: "season", desc: true }]}
            getCellStyle={getCellStyle}
          />
        )}

        {hasPending && (
          <div className={cn("flex flex-col", hasExisting && "mt-1")}>
            {pendingRows.map((row, i) => {
              const isProjected = row.statType === "projected"
              const pendingKey = specKey({
                ...row,
                split: SPLIT_NORM[row.split] ?? row.split,
              })
              const pendingHex = existingSpecKeys.has(pendingKey)
                ? (specToHex.get(pendingKey) ?? null)
                : null
              return (
                <div
                  key={row.id}
                  className={cn(
                    "grid grid-cols-[240fr_400fr_50fr] items-center border-b border-border transition-all duration-150 ease-in",
                    dismissingIds.has(row.id)
                      ? "max-h-0 opacity-0 overflow-hidden"
                      : "max-h-20 opacity-100",
                  )}
                  style={
                    pendingHex
                      ? { background: matchGradient(pendingHex) }
                      : undefined
                  }
                >
                  <span className="pl-4 pr-3 py-2 truncate font-medium">
                    {row.file.name}
                  </span>
                  <div className="px-3 py-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Input
                      type="number"
                      value={row.season}
                      min={2000}
                      max={2100}
                      onChange={(e) => {
                        const y = Number(e.target.value)
                        if (Number.isInteger(y) && y >= 2000 && y <= 2100)
                          patchRow(row.id, { season: y })
                      }}
                      className="w-[76px]"
                      size="sm"
                    />
                    <FilterGroup
                      options={[
                        { value: "BATTER", label: "Batters" },
                        { value: "PITCHER", label: "Pitchers" },
                      ]}
                      value={row.playerType}
                      onChange={(v) =>
                        patchRow(row.id, { playerType: v as PlayerType })
                      }
                      size="sm"
                    />
                    <FilterGroup
                      options={[
                        { value: "actual", label: "Actual" },
                        { value: "projected", label: "Projected" },
                      ]}
                      value={row.statType}
                      onChange={(v) => {
                        const statType = v as StatType
                        patchRow(row.id, {
                          statType,
                          projection:
                            statType === "actual" ? "None" : "Steamer",
                          split: statType === "actual" ? "none" : row.split,
                        })
                      }}
                      size="sm"
                    />
                    {isProjected && (
                      <>
                        <Select
                          value={
                            row.projection === "None"
                              ? "Steamer"
                              : row.projection
                          }
                          onChange={(e) =>
                            patchRow(row.id, {
                              projection: e.target.value as Projection,
                            })
                          }
                          size="sm"
                        >
                          {PROJECTION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={row.split}
                          onChange={(e) =>
                            patchRow(row.id, { split: e.target.value as Split })
                          }
                          size="sm"
                        >
                          {SPLIT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </>
                    )}
                    {row.error && (
                      <FormError className="w-full">{row.error}</FormError>
                    )}
                  </div>
                  <div className="pl-3 pr-4 py-2 flex justify-end">
                    <IconButton
                      aria-label="Dismiss"
                      onClick={() =>
                        triggerDismiss(row.id, () => removeRow(row.id))
                      }
                    >
                      <XIcon />
                    </IconButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          className={cn(
            "flex items-center justify-between",
            (hasExisting || hasPending) && "mt-3",
          )}
        >
          <FileLabel
            size="sm"
            accept=".csv"
            multiple
            onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          >
            Select Files…
          </FileLabel>
          {hasPending && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingRows.some((r) => r.saving)}
                onClick={() => setPendingRows([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={pendingRows.some((r) => r.saving)}
                onClick={handleSaveAll}
              >
                {pendingRows.some((r) => r.saving) ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
