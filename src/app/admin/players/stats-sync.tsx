"use client"

import { BarChart2Icon, Loader2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SectionCollapsible } from "@/components/section-collapsible"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { UploadStats } from "../upload-stats"
import type { StatUploadRow, SyncStatus } from "./page"

const PROJECTION_LABEL: Record<string, string> = {
  None: "None",
  ZiPS: "ZiPS",
  Steamer: "Steamer",
  ATC: "ATC",
  TheBat: "The Bat",
  TheBatX: "The Bat X",
  OOPSY: "OOPSY",
}

const SPLIT_LABEL: Record<string, string> = {
  None: "None",
  VsLeft: "vs Left",
  VsRight: "vs Right",
}

const PLAYER_TYPE_LABEL: Record<string, string> = {
  BATTER: "Batters",
  PITCHER: "Pitchers",
}

function StatUploadsTable({
  uploads,
  onDelete,
}: {
  uploads: StatUploadRow[]
  onDelete: (id: string) => Promise<void>
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    setConfirmingId(null)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (uploads.length === 0) {
    return <p className="caption">No uploads yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Year
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Type
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Projection
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Split
            </th>
            <th className="pb-2 font-medium text-muted-foreground">Uploaded</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {uploads.map((u) => (
            <tr key={u.id} className="border-b border-border/50 last:border-0">
              <td className="py-1.5 pr-4">{u.season}</td>
              <td className="py-1.5 pr-4">
                {PLAYER_TYPE_LABEL[u.playerType] ?? u.playerType}
              </td>
              <td className="py-1.5 pr-4">
                {PROJECTION_LABEL[u.projection] ?? u.projection}
              </td>
              <td className="py-1.5 pr-4">{SPLIT_LABEL[u.split] ?? u.split}</td>
              <td className="py-1.5 text-muted-foreground">
                {new Date(u.createdAt).toLocaleString()}
              </td>
              <td className="py-1.5 pl-2 text-right">
                {deletingId === u.id ? (
                  <Loader2Icon
                    size={14}
                    className="animate-spin text-muted-foreground"
                  />
                ) : confirmingId === u.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    onBlur={() => setConfirmingId(null)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2Icon size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(u.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Trash2Icon size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatsSync({
  status,
  className,
}: {
  status: SyncStatus
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
          <BarChart2Icon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">Import Stats</span>
        </Button>
      </div>
      <p className="caption">
        {lastUploadedStats
          ? `Last upload ${new Date(lastUploadedStats.createdAt).toLocaleString()}`
          : "No player stats."}
      </p>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerContent side="right" width="w-170">
          <DrawerHeader onClose={() => setOpen(false)}>
            <DrawerTitle>Import Player Stats</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <section>
              <p className="mb-4">
                Stats uploads are added by type. Add one CSV at a time for each
                year, with split and projection system if desired.
              </p>
              <UploadStats
                lastUploadedAt={lastUploadedStats?.createdAt ?? null}
                className="mb-4"
              />
              <SectionCollapsible
                title="Upload history"
                size="md"
                defaultOpen={false}
                className="pt-2"
              >
                <StatUploadsTable
                  uploads={recentStatUploads}
                  onDelete={handleDelete}
                />
              </SectionCollapsible>
            </section>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
