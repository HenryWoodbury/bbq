"use client"

import { ChevronDownIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatDateTime } from "@/lib/date"
import { UploadStats } from "../upload-stats"
import type { SyncStatus } from "./page"

export function PlayerStatsSection({
  status,
  defaultOpen,
}: {
  status: SyncStatus
  defaultOpen: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const psParam = searchParams.get("ps")
  const open = psParam !== null ? psParam === "1" : defaultOpen

  const [isSaving, setIsSaving] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  const { lastUploadedStats, recentStatUploads } = status

  async function handleDelete(id: string) {
    await fetch(`/api/admin/stat-uploads/${id}`, { method: "DELETE" })
    router.refresh()
  }

  function handleToggle(next: boolean) {
    const p = new URLSearchParams(searchParams.toString())
    next ? p.set("ps", "1") : p.delete("ps")
    router.push(`?${p.toString()}`, { scroll: false })
  }

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <div className="card">
        <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg data-[state=open]:rounded-b-none">
          <h2>Manage Stats</h2>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-4 pb-6 pt-4">
          <p className="caption mb-4">
            {lastUploadedStats
              ? `Last upload ${formatDateTime(lastUploadedStats.createdAt)}`
              : "No player stats."}
          </p>
          <p className="mb-6">
            Each set of player stats is a single CSV upload for year, batter or
            pitcher, actual or projected. Projections have additional fields for
            source, scope, and split.
          </p>
          <UploadStats
            existingUploads={recentStatUploads}
            onDelete={handleDelete}
            saveRef={saveRef}
            onSavingChange={setIsSaving}
          />
          <div className="mt-6 flex justify-end">
            <Button
              size="md"
              onClick={() => saveRef.current?.()}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
