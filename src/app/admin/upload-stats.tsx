"use client"

import {
  PlusIcon,
  Trash2Icon,
  Undo2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { type RefObject, useRef, useState } from "react"
import { FilterGroup } from "@/components/filter-group"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileLabel } from "@/components/ui/file-label"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { showToast } from "@/components/ui/sonner"
import { splitDateTime } from "@/lib/date"
import { PROJECTION_DISPLAY, SPLIT_DISPLAY } from "@/lib/stat-labels"
import { cn } from "@/lib/utils"
import type { StatUploadRow } from "./players/page"

// ── Types ──────────────────────────────────────────────────────────────────────

type PlayerType = "BATTER" | "PITCHER"
type StatType = "actual" | "projected"
type Projection =
  | "None"
  | "ATC"
  | "DepthCharts"
  | "OOPSY"
  | "Steamer"
  | "TheBat"
  | "TheBatX"
  | "ZiPS"
  | "ZiPSDC"
type Split = "none" | "neutral" | "vs_left" | "vs_right"

type PendingRow = {
  id: string
  fileName: string | null
  season: number
  playerType: PlayerType
  statType: StatType
  projection: Projection
  split: Split
  ros: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

function makeRow(): PendingRow {
  return {
    id: crypto.randomUUID(),
    fileName: null,
    season: CURRENT_YEAR,
    playerType: "BATTER",
    statType: "actual",
    projection: "None",
    split: "none",
    ros: false,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SplitCell({ upload }: { upload: StatUploadRow }) {
  const proj = PROJECTION_DISPLAY[upload.projection]
  const split = SPLIT_DISPLAY[upload.split] ?? upload.split
  if (upload.projection !== "None" && proj && proj !== "–") {
    return (
      <div className="leading-tight">
        <div className="text-xs">{proj}</div>
        <div>{split}</div>
      </div>
    )
  }
  return <>{split}</>
}

// ── ExistingRow ────────────────────────────────────────────────────────────────

function ExistingRow({
  upload,
  isReplacing,
  replaceFileName,
  fileRefSetter,
  onStartReplace,
  onCancelReplace,
  onReplaceFileChange,
  onDelete,
}: {
  upload: StatUploadRow
  isReplacing: boolean
  replaceFileName: string | null
  fileRefSetter: (el: HTMLInputElement | null) => void
  onStartReplace: () => void
  onCancelReplace: () => void
  onReplaceFileChange: (name: string) => void
  onDelete: () => void
}) {
  const { date, time } = splitDateTime(upload.createdAt)

  return (
    <tr className="border-b border-border/50 last:border-0">
      {/* File */}
      <td className="py-1.5 pr-4 max-w-[120px]">
        {isReplacing ? (
          <FileLabel
            ref={fileRefSetter}
            accept=".csv"
            onChange={(e) =>
              onReplaceFileChange(e.target.files?.[0]?.name ?? "")
            }
            className="min-w-[150px] truncate whitespace-nowrap"
          >
            {replaceFileName ?? "Choose CSV…"}
          </FileLabel>
        ) : (
          <span
            className="block truncate text-xs text-muted-foreground"
            title={upload.fileName ?? undefined}
          >
            {upload.fileName ?? "—"}
          </span>
        )}
      </td>

      {/* Season */}
      <td className="py-1.5 pr-4 whitespace-nowrap">
        <div className="leading-tight">
          <div>{upload.season}</div>
          {upload.ros && (
            <div className="text-xs text-muted-foreground">RoS</div>
          )}
        </div>
      </td>

      {/* Role */}
      <td className="py-1.5 pr-4">
        {upload.playerType === "BATTER" ? "Batter" : "Pitcher"}
      </td>

      {/* Type */}
      <td className="py-1.5 pr-4">
        {upload.projection === "None" ? "Actual" : "Projection"}
      </td>

      {/* Split */}
      <td className="py-1.5 pr-4">
        <SplitCell upload={upload} />
      </td>

      {/* Updated */}
      <td className="py-1.5 pr-4">
        <div className="leading-tight">
          <div>{date}</div>
          <div className="text-xs">{time}</div>
        </div>
      </td>

      {/* Actions */}
      <td className="py-1.5">
        <div className="flex items-center justify-end gap-0.5">
          {isReplacing ? (
            <IconButton onClick={onCancelReplace} aria-label="Undo replace">
              <Undo2Icon className="h-3.5 w-3.5" />
            </IconButton>
          ) : (
            <IconButton onClick={onStartReplace} aria-label="Replace file">
              <UploadIcon className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <IconButton onClick={onDelete} aria-label="Delete upload">
            <Trash2Icon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </td>
    </tr>
  )
}

// ── PendingRowDisplay ──────────────────────────────────────────────────────────

function PendingRowDisplay({
  row,
  canRemove,
  fileRefSetter,
  onFileChange,
  onRowChange,
  onRemove,
}: {
  row: PendingRow
  canRemove: boolean
  fileRefSetter: (el: HTMLInputElement | null) => void
  onFileChange: (name: string | null) => void
  onRowChange: (patch: Partial<PendingRow>) => void
  onRemove: () => void
}) {
  const isCurrentYear = row.season === CURRENT_YEAR
  const isProjected = row.statType === "projected"

  function handleSeasonChange(e: React.ChangeEvent<HTMLInputElement>) {
    const y = Number(e.target.value)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return
    onRowChange({ season: y })
  }

  // Flat 6-column grid: [File] [Season] [Role] [Type] [spacer-1fr] [Actions]
  // Projection row:     [empty] [RoS] [Projection + Split span-2] [spacer] [empty]
  return (
    <div className="border-b border-border/50">
      <div className="grid grid-cols-[auto_auto_auto_auto_1fr_auto] gap-x-4 py-3">
        <div>
          <FileLabel
            ref={fileRefSetter}
            size="sm"
            accept=".csv"
            onChange={(e) => onFileChange(e.target.files?.[0]?.name ?? null)}
            className="min-w-[150px] truncate whitespace-nowrap"
          >
            {row.fileName ?? "Choose CSV…"}
          </FileLabel>
        </div>
        <div>
          <Input
            type="number"
            value={row.season}
            min={2000}
            max={2100}
            onChange={handleSeasonChange}
            className="w-20"
            size="sm"
          />
        </div>
        <div>
          <FilterGroup
            options={[
              { value: "BATTER", label: "Batters" },
              { value: "PITCHER", label: "Pitchers" },
            ]}
            value={row.playerType}
            onChange={(v) => onRowChange({ playerType: v as PlayerType })}
            size="sm"
          />
        </div>
        <div>
          <FilterGroup
            options={[
              { value: "actual", label: "Actual" },
              { value: "projected", label: "Projected" },
            ]}
            value={row.statType}
            onChange={(v) => {
              const statType = v as StatType
              onRowChange({
                statType,
                projection: statType === "actual" ? "None" : "Steamer",
                split: statType === "actual" ? "none" : row.split,
                ros: statType === "actual" ? false : row.ros,
              })
            }}
            size="sm"
          />
        </div>
        <div />
        <div className="flex items-center justify-end">
          <IconButton
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Remove row"
          >
            <XIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
        <div />
        {/* RoS — below Season */}
        <div
          className="grid transition-[grid-template-rows] duration-200"
          style={{ gridTemplateRows: isProjected ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="pl-3 py-1.5">
              {isCurrentYear ? (
                <label className="flex cursor-pointer items-center gap-1.5">
                  <Checkbox
                    checked={row.ros}
                    onChange={(e) => onRowChange({ ros: e.target.checked })}
                    tabIndex={isProjected ? undefined : -1}
                  />
                  <span className="text-body font-normal text-muted-foreground">
                    RoS
                  </span>
                </label>
              ) : (
                <div className="h-6" />
              )}
            </div>
          </div>
        </div>
        {/* Projection + Split — below Batters/Pitchers and Actual/Projected */}
        <div
          className="col-span-2 grid transition-[grid-template-rows] duration-200"
          style={{ gridTemplateRows: isProjected ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 py-1.5 px-1.5">
              <Select
                value={row.projection === "None" ? "Steamer" : row.projection}
                onChange={(e) =>
                  onRowChange({ projection: e.target.value as Projection })
                }
                size="sm"
                tabIndex={isProjected ? undefined : -1}
              >
                <option value="ATC">ATC</option>
                <option value="DepthCharts">Depth Charts</option>
                <option value="OOPSY">OOPSY</option>
                <option value="Steamer">Steamer</option>
                <option value="TheBat">The Bat</option>
                <option value="TheBatX">The Bat X</option>
                <option value="ZiPS">ZiPS</option>
                <option value="ZiPSDC">ZiPS DC</option>
              </Select>
              <Select
                value={row.split}
                onChange={(e) =>
                  onRowChange({ split: e.target.value as Split })
                }
                size="sm"
                tabIndex={isProjected ? undefined : -1}
              >
                <option value="none">None</option>
                <option value="neutral">Neutral</option>
                <option value="vs_left">vs Left</option>
                <option value="vs_right">vs Right</option>
              </Select>
            </div>
          </div>
        </div>
        <div />
        <div />
      </div>
    </div>
  )
}

// ── UploadStats ────────────────────────────────────────────────────────────────

export function UploadStats({
  existingUploads,
  onDelete,
  saveRef,
  onSavingChange,
  className,
}: {
  existingUploads: StatUploadRow[]
  onDelete: (id: string) => Promise<void>
  saveRef: RefObject<(() => Promise<void>) | null>
  onSavingChange: (v: boolean) => void
  className?: string
}) {
  const router = useRouter()
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([makeRow()])
  // key presence = replacing mode; value = chosen filename (null if not yet chosen)
  const [replacing, setReplacing] = useState<Record<string, string | null>>({})
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  )
  const fileRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())

  const visibleExisting = existingUploads.filter(
    (u) => !pendingDeleteIds.has(u.id),
  )
  const hasExisting = visibleExisting.length > 0
  const canRemovePending = pendingRows.length > 1 || hasExisting

  // Write save handler to ref on each render (ref writes during render are fine)
  saveRef.current = handleSave

  async function submitUpload(
    file: File,
    opts: {
      season: number
      playerType: PlayerType
      statType: StatType
      projection: Projection
      split: Split
      ros: boolean
    },
  ): Promise<void> {
    const body = new FormData()
    body.append("file", file)
    body.append("fileName", file.name)
    body.append("season", String(opts.season))
    body.append("playerType", opts.playerType)
    if (opts.statType === "projected") {
      body.append("projection", opts.projection)
      body.append("split", opts.split)
      body.append("ros", String(opts.ros))
    }
    await fetch("/api/admin/upload-stats", { method: "POST", body })
  }

  async function handleSave() {
    onSavingChange(true)
    try {
      for (const row of pendingRows) {
        const file = fileRefs.current.get(row.id)?.files?.[0]
        if (!file) continue
        await submitUpload(file, {
          season: row.season,
          playerType: row.playerType,
          statType: row.statType,
          projection: row.projection,
          split: row.split,
          ros: row.ros,
        })
      }

      for (const uploadId of Object.keys(replacing)) {
        const upload = existingUploads.find((u) => u.id === uploadId)
        if (!upload) continue
        const file = fileRefs.current.get(`replace-${uploadId}`)?.files?.[0]
        if (!file) continue
        await submitUpload(file, {
          season: upload.season,
          playerType: upload.playerType as PlayerType,
          statType: upload.projection === "None" ? "actual" : "projected",
          projection: upload.projection as Projection,
          split: upload.split as Split,
          ros: upload.ros,
        })
      }

      setPendingRows([makeRow()])
      setReplacing({})
    } finally {
      router.refresh()
      onSavingChange(false)
    }
  }

  function scheduleDelete(id: string) {
    setPendingDeleteIds((prev) => new Set(prev).add(id))
    let cancelled = false
    let executed = false

    function clearPending() {
      setPendingDeleteIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }

    async function execute() {
      if (executed || cancelled) return
      executed = true
      try {
        await onDelete(id)
      } finally {
        clearPending()
      }
    }

    showToast({
      title: "Upload removed from history.",
      action: {
        label: "Restore",
        onClick: () => {
          cancelled = true
          clearPending()
        },
      },
      onDismiss: execute,
      onAutoClose: execute,
    })
  }

  function updateRow(id: string, patch: Partial<PendingRow>) {
    setPendingRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
  }

  function removeRow(id: string) {
    fileRefs.current.delete(id)
    setPendingRows((prev) => prev.filter((r) => r.id !== id))
  }

  function addRow() {
    setPendingRows((prev) => [...prev, makeRow()])
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn(className)}>
      {/* Existing uploads table */}
      {hasExisting && (
        <table className="w-full text-sm border-collapse mb-0">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                File
              </th>
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                Season
              </th>
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                Role
              </th>
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                Type
              </th>
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                Split
              </th>
              <th className="pb-2 pr-4 font-medium text-muted-foreground">
                Updated
              </th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {visibleExisting.map((upload) => (
              <ExistingRow
                key={upload.id}
                upload={upload}
                isReplacing={upload.id in replacing}
                replaceFileName={replacing[upload.id] ?? null}
                fileRefSetter={(el) => {
                  const key = `replace-${upload.id}`
                  if (el) fileRefs.current.set(key, el)
                  else fileRefs.current.delete(key)
                }}
                onStartReplace={() =>
                  setReplacing((prev) => ({ ...prev, [upload.id]: null }))
                }
                onCancelReplace={() =>
                  setReplacing((prev) => {
                    const next = { ...prev }
                    delete next[upload.id]
                    return next
                  })
                }
                onReplaceFileChange={(name) =>
                  setReplacing((prev) => ({ ...prev, [upload.id]: name }))
                }
                onDelete={() => scheduleDelete(upload.id)}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Pending (new) rows — outside the table, bordered to match */}
      <div className={cn(hasExisting && "border-t border-border")}>
        {pendingRows.map((row) => (
          <PendingRowDisplay
            key={row.id}
            row={row}
            canRemove={canRemovePending}
            fileRefSetter={(el) => {
              if (el) fileRefs.current.set(row.id, el)
              else fileRefs.current.delete(row.id)
            }}
            onFileChange={(name) => updateRow(row.id, { fileName: name })}
            onRowChange={(patch) => updateRow(row.id, patch)}
            onRemove={() => removeRow(row.id)}
          />
        ))}
      </div>

      {/* Add Another */}
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          <PlusIcon size={14} />
          Add Another
        </Button>
      </div>
    </div>
  )
}
