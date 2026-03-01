"use client";

import { useRef, useState } from "react";

type ImportResult = { total: number; inserted: number; updated: number; deleted: number; importedAt: string };
type RowError = { row: number; field: string; message: string };
type ErrorResult = { errorCount: number; errors: RowError[] };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: ImportResult }
  | { status: "error"; errorCount: number; errors: RowError[] }
  | { status: "fatal"; message: string };

export function PlayerImport() {
  const [state, setState] = useState<State>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [additive, setAdditive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setState({ status: "loading" });

    const body = new FormData();
    body.append("file", file);
    body.append("mode", additive ? "additive" : "replace");

    try {
      const res = await fetch("/api/players/import", { method: "POST", body });
      const data = await res.json();

      if (res.ok) {
        setState({ status: "success", result: data as ImportResult });
        if (fileRef.current) fileRef.current.value = "";
        setFileName(null);
      } else if (res.status === 422) {
        const { errorCount, errors } = data as ErrorResult;
        setState({ status: "error", errorCount, errors });
      } else {
        setState({ status: "fatal", message: (data as { error?: string }).error ?? "Import failed" });
      }
    } catch {
      setState({ status: "fatal", message: "Network error" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fileName ?? "Choose CSV…"}
        </label>
        <button
          type="submit"
          disabled={!fileName || state.status === "loading"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {state.status === "loading" ? "Importing…" : "Import"}
        </button>
        {state.status === "loading" && (
          <span className="text-sm text-zinc-500">This may take a moment for large files…</span>
        )}
      </form>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={additive}
          onChange={(e) => setAdditive(e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        Append players only
      </label>

      {state.status === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <div>
            Import complete — <strong>{state.result.total.toLocaleString()}</strong> rows (
            <strong>{state.result.inserted.toLocaleString()}</strong> inserted,{" "}
            <strong>{state.result.updated.toLocaleString()}</strong> updated
            {state.result.deleted > 0 && (
              <>, <strong>{state.result.deleted.toLocaleString()}</strong> removed</>
            )})
          </div>
          <div className="mt-1 text-xs opacity-70">
            Last updated {new Date(state.result.importedAt).toLocaleString()}
          </div>
        </div>
      )}

      {state.status === "fatal" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {state.message}
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col gap-2">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {state.errorCount.toLocaleString()} validation error
            {state.errorCount !== 1 ? "s" : ""}
            {state.errorCount > state.errors.length ? " — showing first 10" : ""}. Fix these and re-upload. No rows were written.
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  {["Row", "Field", "Message"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {state.errors.map((err, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {err.row}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-50">
                      {err.field}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
