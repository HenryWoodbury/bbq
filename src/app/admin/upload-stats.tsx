"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { FilterGroup } from "@/components/filter-group"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileLabel } from "@/components/ui/file-label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type UploadResult = {
  total: number
  linked: number
  skipped: number
  upserted: number
  uploadedAt: string
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: UploadResult }
  | { status: "error"; message: string }

type Split = "none" | "vs_left" | "vs_right"
type PlayerType = "BATTER" | "PITCHER"
type Projection =
  | "None"
  | "ZiPS"
  | "Steamer"
  | "ATC"
  | "TheBat"
  | "TheBatX"
  | "OOPSY"

export function UploadStats({
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
  const [season, setSeason] = useState(new Date().getFullYear())
  const [playerType, setPlayerType] = useState<PlayerType>("BATTER")
  const [projection, setProjection] = useState<Projection>("None")
  const [split, setSplit] = useState<Split>("none")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setState({ status: "loading" })

    const body = new FormData()
    body.append("file", file)
    body.append("season", String(season))
    body.append("playerType", playerType)
    body.append("projection", projection)
    body.append("split", split)

    try {
      const res = await fetch("/api/admin/upload-stats", {
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
    <div className={cn("flex flex-col gap-4", className)}>
      <p className="caption">
        {lastUploadedAt
          ? `Last imported ${new Date(lastUploadedAt).toLocaleString()}`
          : "No imports yet."}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <FilterGroup
            options={[
              { value: "BATTER", label: "Batters" },
              { value: "PITCHER", label: "Pitchers" },
            ]}
            value={playerType}
            onChange={(v) => setPlayerType(v as PlayerType)}
          />
          <Input
            id="stats-season"
            type="number"
            value={season}
            min={2000}
            max={2100}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="w-20"
          />
          <Select
            id="stats-split"
            value={split}
            onChange={(e) => setSplit(e.target.value as Split)}
          >
            <option value="none">Split</option>
            <option value="vs_left">vs Left</option>
            <option value="vs_right">vs Right</option>
          </Select>
          <Select
            id="stats-projection"
            value={projection}
            onChange={(e) => setProjection(e.target.value as Projection)}
          >
            <option value="None">Projection</option>
            <option value="ZiPS">ZiPS</option>
            <option value="Steamer">Steamer</option>
            <option value="ATC">ATC</option>
            <option value="TheBat">The Bat</option>
            <option value="TheBatX">The Bat X</option>
            <option value="OOPSY">OOPSY</option>
          </Select>
        </div>

        <div className="flex items-center gap-3">
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

          {state.status === "loading" && (
            <span className="body-muted">Uploading…</span>
          )}
        </div>
      </form>

      {state.status === "success" && (
        <Alert variant="success">
          <div>
            Upload complete —{" "}
            <strong>{state.result.linked.toLocaleString()}</strong> /{" "}
            <strong>{state.result.total.toLocaleString()}</strong> rows linked
            {state.result.skipped > 0 && (
              <>
                {" "}
                (<strong>{state.result.skipped.toLocaleString()}</strong>{" "}
                skipped)
              </>
            )}
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
