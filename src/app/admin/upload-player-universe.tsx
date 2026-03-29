"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileLabel } from "@/components/ui/file-label"
import { cn } from "@/lib/utils"

type UploadResult = {
  total: number
  inserted: number
  updated: number
  deleted: number
  uploadedAt: string
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: UploadResult }
  | { status: "error"; message: string }

export function UploadPlayerUniverse({
  lastUploadedAt,
  className,
}: {
  lastUploadedAt: Date | null
  className?: string
}) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: "idle" })
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setState({ status: "loading" })

    const body = new FormData()
    body.append("file", file)
    body.append("mode", "replace")

    try {
      const res = await fetch("/api/admin/upload-universe", {
        method: "POST",
        body,
      })
      const data = await res.json()

      if (res.ok) {
        setState({ status: "success", result: data as UploadResult })
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
        router.refresh()
      } else {
        setState({
          status: "error",
          message: (data as { error?: string }).error ?? "Upload failed",
        })
      }
    } catch {
      setState({ status: "error", message: "Network error" })
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="caption">
        {lastUploadedAt
          ? `Last imported ${new Date(lastUploadedAt).toLocaleString()}`
          : "No imports yet."}
      </p>
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
          {state.status === "loading" ? "Uploading…" : "Upload"}
        </Button>
      </form>

      {state.status === "success" && (
        <Alert variant="success">
          <div>
            Upload complete —{" "}
            <strong>{state.result.total.toLocaleString()}</strong> players (
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
            Uploaded {new Date(state.result.uploadedAt).toLocaleString()}
          </div>
        </Alert>
      )}

      {state.status === "error" && (
        <Alert variant="error">{state.message}</Alert>
      )}
    </div>
  )
}
