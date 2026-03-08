"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type UploadResult = { total: number; inserted: number; updated: number; deleted: number; uploadedAt: string };

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: UploadResult }
  | { status: "error"; message: string };

export function UploadPlayerUniverse({ lastUploadedAt }: { lastUploadedAt: Date | null }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setState({ status: "loading" });

    const body = new FormData();
    body.append("file", file);
    body.append("mode", "replace");

    try {
      const res = await fetch("/api/admin/upload-universe", { method: "POST", body });
      const data = await res.json();

      if (res.ok) {
        setState({ status: "success", result: data as UploadResult });
        if (fileRef.current) fileRef.current.value = "";
        setFileName(null);
        router.refresh();
      } else {
        setState({ status: "error", message: (data as { error?: string }).error ?? "Upload failed" });
      }
    } catch {
      setState({ status: "error", message: "Network error" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {lastUploadedAt && state.status !== "success" && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Last imported {new Date(lastUploadedAt).toLocaleString()}
        </p>
      )}
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
        <Button
          type="submit"
          disabled={!fileName || state.status === "loading"}
        >
          {state.status === "loading" ? "Uploading…" : "Upload"}
        </Button>
        {state.status === "loading" && (
          <span className="text-sm text-zinc-500">This may take a moment for large files…</span>
        )}
      </form>

      {state.status === "success" && (
        <Alert variant="success">
          <div>
            Upload complete — <strong>{state.result.total.toLocaleString()}</strong> players (
            <strong>{state.result.inserted.toLocaleString()}</strong> inserted,{" "}
            <strong>{state.result.updated.toLocaleString()}</strong> updated
            {state.result.deleted > 0 && (
              <>, <strong>{state.result.deleted.toLocaleString()}</strong> removed</>
            )})
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
  );
}
