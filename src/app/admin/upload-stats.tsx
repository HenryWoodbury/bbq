"use client"

import { useRef, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileLabel } from "@/components/ui/file-label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

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

export function UploadStats({ lastUploadedAt }: { lastUploadedAt: Date | null }) {
  const [state, setState] = useState<State>({ status: "idle" })
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [season, setSeason] = useState(new Date().getFullYear())
  const [playerType, setPlayerType] = useState<PlayerType>("BATTER")
  const [projected, setProjected] = useState(true)
  const [neutralized, setNeutralized] = useState(false)
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
    body.append("projected", String(projected))
    body.append("neutralized", String(neutralized))
    body.append("split", split)

    try {
      const res = await fetch("/api/admin/upload-stats", { method: "POST", body })
      const data = await res.json()

      if (res.ok) {
        setState({ status: "success", result: data as UploadResult })
        if (fileRef.current) fileRef.current.value = ""
        setFileName(null)
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
    <div className="flex flex-col gap-4">
      {lastUploadedAt && state.status !== "success" && (
        <p className="caption">
          Last imported {new Date(lastUploadedAt).toLocaleString()}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <FileLabel
            ref={fileRef}
            accept=".csv"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          >
            {fileName ?? "Choose CSV…"}
          </FileLabel>

          <div className="flex items-center gap-1.5">
            <Label className="body-muted" htmlFor="stats-season">
              Season
            </Label>
            <Input
              id="stats-season"
              type="number"
              value={season}
              min={2000}
              max={2100}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="body-muted" htmlFor="stats-player-type">
              Type
            </Label>
            <Select
              id="stats-player-type"
              value={playerType}
              onChange={(e) => setPlayerType(e.target.value as PlayerType)}
            >
              <option value="BATTER">Batters</option>
              <option value="PITCHER">Pitchers</option>
            </Select>
          </div>

          <Label className="flex cursor-pointer items-center gap-1.5 body-muted">
            <Checkbox
              checked={projected}
              onChange={(e) => setProjected(e.target.checked)}
            />
            Projected
          </Label>

          <Label className="flex cursor-pointer items-center gap-1.5 body-muted">
            <Checkbox
              checked={neutralized}
              onChange={(e) => setNeutralized(e.target.checked)}
            />
            Neutralized
          </Label>

          <div className="flex items-center gap-1.5">
            <Label className="body-muted" htmlFor="stats-split">
              Split
            </Label>
            <Select
              id="stats-split"
              value={split}
              onChange={(e) => setSplit(e.target.value as Split)}
            >
              <option value="none">None</option>
              <option value="vs_left">vs Left</option>
              <option value="vs_right">vs Right</option>
            </Select>
          </div>

          <Button
            type="submit"
            size="md"
            disabled={!fileName || state.status === "loading"}
          >
            {state.status === "loading" ? "Uploading…" : "Upload"}
          </Button>

          {state.status === "loading" && (
            <span className="body-muted">This may take a moment…</span>
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
                (<strong>{state.result.skipped.toLocaleString()}</strong> skipped)
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
