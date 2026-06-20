"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { DataTable } from "@/components/data-table"
import { Trash2Icon } from "@/components/icons/lucide"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileLabel } from "@/components/ui/file-label"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { useOptimisticDelete } from "@/hooks/use-optimistic-delete"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"

export type UploadHistoryRow = {
  id: string
  season: number
  fileName: string | null
  createdAt: Date
}

export function UploadHistoryPanel({
  rows,
  uploadUrl,
  deleteUrlBase,
  className,
}: {
  rows: UploadHistoryRow[]
  uploadUrl: string
  deleteUrlBase: string
  className?: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [season, setSeason] = useState(() => new Date().getFullYear())
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { pendingDeleteIds, scheduleDelete } =
    useOptimisticDelete<UploadHistoryRow>({
      getId: (row) => row.id,
      title: "Upload removed.",
      variant: "warning",
      perform: async (row) =>
        (await fetch(`${deleteUrlBase}/${row.id}`, { method: "DELETE" })).ok,
      onSuccess: () => router.refresh(),
      errorMessage: () => "Failed to delete upload",
    })

  const visibleRows = rows.filter((r) => !pendingDeleteIds.has(r.id))

  async function handleSave() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setStatus("saving")
    setErrorMessage("")

    const body = new FormData()
    body.append("file", file)
    body.append("season", String(season))
    body.append("mode", "replace")

    try {
      const res = await fetch(uploadUrl, { method: "POST", body })
      const data = (await res.json()) as { error?: string }
      if (res.ok) {
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
        setStatus("idle")
        router.refresh()
      } else {
        setErrorMessage(data.error ?? "Upload failed")
        setStatus("error")
      }
    } catch {
      setErrorMessage("Network error")
      setStatus("error")
    }
  }

  const columns: ColumnDef<UploadHistoryRow, unknown>[] = [
    {
      accessorKey: "fileName",
      header: "File Name",
      size: 500,
      cell: ({ row }) => (
        <span className="truncate text-sm">{row.original.fileName ?? "—"}</span>
      ),
    },
    {
      accessorKey: "season",
      header: "Season",
      size: 150,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.season}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Updated",
      size: 150,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap tabular-nums">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <IconButton
            variant="destructive"
            aria-label="Delete upload"
            onClick={() => scheduleDelete(row.original)}
          >
            <Trash2Icon />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div className={cn("flex flex-col gap-3 max-w-[960px]", className)}>
      {visibleRows.length > 0 && (
        <DataTable
          columns={columns}
          data={visibleRows}
          pagination={false}
          defaultSorting={[{ id: "createdAt", desc: true }]}
        />
      )}

      <div className="flex items-center gap-3">
        <FileLabel
          ref={fileRef}
          accept=".csv"
          size="sm"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        >
          {fileName ?? "Select File…"}
        </FileLabel>
        <Input
          type="number"
          value={season}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!Number.isNaN(v)) setSeason(v)
          }}
          className="w-20"
          size="sm"
          placeholder="Year"
        />
        {fileName && (
          <Button
            size="sm"
            variant="secondary"
            disabled={status === "saving"}
            onClick={() => {
              if (fileRef.current) fileRef.current.value = ""
              setFileName(null)
              setStatus("idle")
              setErrorMessage("")
            }}
          >
            Clear
          </Button>
        )}
        <Button
          size="sm"
          disabled={!fileName || status === "saving"}
          onClick={handleSave}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </Button>
      </div>

      {status === "error" && <Alert variant="error">{errorMessage}</Alert>}
    </div>
  )
}
