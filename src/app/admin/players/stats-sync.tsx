"use client"

import { BarChart2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import { UploadStats } from "../upload-stats"
import type { SyncStatus } from "./page"

export function StatsSync({
  status,
  className,
}: {
  status: SyncStatus
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveRef = useRef<(() => Promise<void>) | null>(null)
  const { lastUploadedStats, recentStatUploads } = status

  async function handleDelete(id: string) {
    await fetch(`/api/admin/stat-uploads/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className={cn(className)}>
      <div className="flex items-center gap-4">
        <h2 className="min-w-36">Player Stats</h2>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <BarChart2Icon />
          <span className="min-w-0 truncate">Import Stats</span>
        </Button>
      </div>
      <p className="caption">
        {lastUploadedStats
          ? `Last upload ${formatDateTime(lastUploadedStats.createdAt)}`
          : "No player stats."}
      </p>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerContent side="right" width="w-150">
          <DrawerHeader onClose={() => setOpen(false)}>
            <DrawerTitle>Import Stats</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <p className="mb-6">
              Each set of player stats is a single CSV upload for year, batter
              or pitcher, actual or projected. Projections have additional
              fields for source, scope, and split.
            </p>
            <UploadStats
              existingUploads={recentStatUploads}
              onDelete={handleDelete}
              saveRef={saveRef}
              onSavingChange={setIsSaving}
            />
          </DrawerBody>
          <DrawerFooter className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="md"
              onClick={() => saveRef.current?.()}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
