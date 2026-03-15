"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type SyncResult = {
  total: number
  inserted: number
  updated: number
  deleted: number
  syncedAt: string
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SyncResult }
  | { status: "error"; message: string }

export function SyncPlayers({ lastSyncedAt }: { lastSyncedAt: Date | null }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: "idle" })
  const [syncedAt, setSyncedAt] = useState<Date | null>(lastSyncedAt)

  async function handleSync() {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/admin/sync-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "replace" }),
      })
      const data = (await res.json()) as SyncResult | { error: string }
      if (res.ok) {
        const result = data as SyncResult
        setState({ status: "success", result })
        setSyncedAt(new Date(result.syncedAt))
        router.refresh()
      } else {
        setState({
          status: "error",
          message: (data as { error: string }).error ?? "Sync failed",
        })
      }
    } catch {
      setState({ status: "error", message: "Network error" })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button onClick={handleSync} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Syncing…" : "Sync Player IDs"}
        </Button>
        {syncedAt && state.status !== "loading" && (
          <span className="caption">
            Last synced {syncedAt.toLocaleString()}
          </span>
        )}
        {state.status === "loading" && (
          <span className="body-muted">
            Fetching from SFBB — this may take a moment…
          </span>
        )}
      </div>

      {state.status === "success" && (
        <Alert variant="success">
          <strong>{state.result.total.toLocaleString()}</strong> players synced
          — <strong>{state.result.inserted.toLocaleString()}</strong> added,{" "}
          <strong>{state.result.updated.toLocaleString()}</strong> updated
          {state.result.deleted > 0 && (
            <>
              , <strong>{state.result.deleted.toLocaleString()}</strong> removed
            </>
          )}
        </Alert>
      )}

      {state.status === "error" && (
        <Alert variant="error">{state.message}</Alert>
      )}
    </div>
  )
}
