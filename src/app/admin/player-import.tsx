"use client"

import { useRef, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileLabel } from "@/components/ui/file-label"
import { Checkbox } from "@/components/ui/checkbox"

type ImportResult = {
  total: number
  inserted: number
  updated: number
  deleted: number
  importedAt: string
}
type RowError = { row: number; field: string; message: string }
type ErrorResult = { errorCount: number; errors: RowError[] }

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: ImportResult }
  | { status: "error"; errorCount: number; errors: RowError[] }
  | { status: "fatal"; message: string }

export function PlayerImport() {
  const [state, setState] = useState<State>({ status: "idle" })
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [additive, setAdditive] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setState({ status: "loading" })

    const body = new FormData()
    body.append("file", file)
    body.append("mode", additive ? "additive" : "replace")

    try {
      const res = await fetch("/api/players/import", { method: "POST", body })
      const data = await res.json()

      if (res.ok) {
        setState({ status: "success", result: data as ImportResult })
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
      } else if (res.status === 422) {
        const { errorCount, errors } = data as ErrorResult
        setState({ status: "error", errorCount, errors })
      } else {
        setState({
          status: "fatal",
          message: (data as { error?: string }).error ?? "Import failed",
        })
      }
    } catch {
      setState({ status: "fatal", message: "Network error" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <FileLabel
          ref={fileRef}
          accept=".csv"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        >
          {fileName ?? "Choose CSV…"}
        </FileLabel>
        <Button
          type="submit"
          size="md"
          disabled={!fileName || state.status === "loading"}
        >
          {state.status === "loading" ? "Importing…" : "Import"}
        </Button>
        {state.status === "loading" && (
          <span className="body-muted">
            This may take a moment for large files…
          </span>
        )}
      </form>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={additive}
          onChange={(e) => setAdditive(e.target.checked)}
        />
        Append players only
      </label>

      {state.status === "success" && (
        <Alert variant="success">
          <div>
            Import complete —{" "}
            <strong>{state.result.total.toLocaleString()}</strong> rows (
            <strong>{state.result.inserted.toLocaleString()}</strong> inserted,{" "}
            <strong>{state.result.updated.toLocaleString()}</strong> updated
            {state.result.deleted > 0 && (
              <>
                , <strong>{state.result.deleted.toLocaleString()}</strong>{" "}
                removed
              </>
            )}
            )
          </div>
          <div className="mt-1 text-xs opacity-70">
            Last updated {new Date(state.result.importedAt).toLocaleString()}
          </div>
        </Alert>
      )}

      {state.status === "fatal" && (
        <Alert variant="error">{state.message}</Alert>
      )}

      {state.status === "error" && (
        <div className="flex flex-col gap-2">
          <Alert variant="error">
            {state.errorCount.toLocaleString()} validation error
            {state.errorCount !== 1 ? "s" : ""}
            {state.errorCount > state.errors.length
              ? " — showing first 10"
              : ""}
            . Fix these and re-upload. No rows were written.
          </Alert>
          <div className="table-container max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="table-head sticky top-0">
                <tr>
                  {["Row", "Field", "Message"].map((h) => (
                    <th key={h} className="table-head-cell">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {state.errors.map((err) => (
                  <tr key={err.row}>
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      {err.row}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-foreground">
                      {err.field}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {err.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
