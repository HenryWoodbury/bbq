"use client";

import { useState } from "react";

type SyncResult = { total: number; inserted: number; updated: number; deleted: number; syncedAt: string };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SyncResult }
  | { status: "error"; message: string };

export function SyncPlayers({ lastSyncedAt }: { lastSyncedAt: Date | null }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [syncedAt, setSyncedAt] = useState<Date | null>(lastSyncedAt);
  const [additive, setAdditive] = useState(false);

  async function handleSync() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/sync-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: additive ? "additive" : "replace" }),
      });
      const data = await res.json() as SyncResult | { error: string };
      if (res.ok) {
        const result = data as SyncResult;
        setState({ status: "success", result });
        setSyncedAt(new Date(result.syncedAt));
      } else {
        setState({ status: "error", message: (data as { error: string }).error ?? "Sync failed" });
      }
    } catch {
      setState({ status: "error", message: "Network error" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={state.status === "loading"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {state.status === "loading" ? "Updating…" : "Update Player Universe"}
        </button>
        {syncedAt && state.status !== "loading" && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Last synced {syncedAt.toLocaleString()}
          </span>
        )}
        {state.status === "loading" && (
          <span className="text-sm text-zinc-500">Fetching from SFBB — this may take a moment…</span>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={additive}
          onChange={(e) => setAdditive(e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        Append only (skip soft-deleting players not in the new data)
      </label>

      {state.status === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <strong>{state.result.total.toLocaleString()}</strong> players synced —{" "}
          <strong>{state.result.inserted.toLocaleString()}</strong> added,{" "}
          <strong>{state.result.updated.toLocaleString()}</strong> updated
          {state.result.deleted > 0 && (
            <>, <strong>{state.result.deleted.toLocaleString()}</strong> removed</>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {state.message}
        </div>
      )}
    </div>
  );
}
