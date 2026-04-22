"use client"

import { ChevronDownIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatDateTime } from "@/lib/date"
import { SyncPlayerMap } from "../sync-player-map"
import { UploadPlayerMap } from "../upload-player-map"
import { UploadPlayerUniverse } from "../upload-player-universe"
import type { SyncStatus } from "./page"

function profileStatusText(
  syncTs: Date | null | undefined,
  uploadTs: Date | null | undefined,
): string {
  if (!syncTs && !uploadTs) return "No player profiles."
  const isSyncMoreRecent = syncTs && (!uploadTs || syncTs >= uploadTs)
  return isSyncMoreRecent
    ? `Last sync ${formatDateTime(syncTs)}`
    : uploadTs
      ? `Last upload ${formatDateTime(uploadTs)}`
      : ""
}

export function PlayerProfilesSection({
  status,
  defaultOpen,
}: {
  status: SyncStatus
  defaultOpen: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ppParam = searchParams.get("pp")
  const open = ppParam !== null ? ppParam === "1" : defaultOpen

  const { lastSyncedPlayer, lastUploadedPlayerMap, lastUploadedUniverse } =
    status

  const profileStatus = profileStatusText(
    lastSyncedPlayer?.updatedAt,
    lastUploadedPlayerMap?.createdAt,
  )

  function handleToggle(next: boolean) {
    const p = new URLSearchParams(searchParams.toString())
    next ? p.set("pp", "1") : p.delete("pp")
    router.push(`?${p.toString()}`, { scroll: false })
  }

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <div className="card">
        <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg data-[state=open]:rounded-b-none">
          <h2>Manage Player Universe</h2>
          <ChevronDownIcon
            size={16}
            className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-4 pb-6 pt-4">
          <p className="caption mb-6">{profileStatus}</p>

          <section className="pb-6 border-b border-border">
            <h3 className="mb-2">Sync Player IDs</h3>
            <p className="mb-3">
              Fetches the{" "}
              <Link href="https://www.smartfantasybaseball.com/tools/">
                Smart Fantasy Baseball Player ID Map
              </Link>{" "}
              then updates the BBQ player profile table.
            </p>
            <SyncPlayerMap
              lastSyncedAt={lastSyncedPlayer?.updatedAt ?? null}
              className="mb-6"
            />
            <p className="mb-2">Alternatively, upload an ID Map CSV.</p>
            <UploadPlayerMap
              lastUploadedAt={lastUploadedPlayerMap?.createdAt ?? null}
            />
          </section>

          <section className="pt-6">
            <h3 className="mb-2">Import the Player Universe</h3>
            <p className="mb-3">
              Upload the full list of players in the{" "}
              <Link href="https://community.ottoneu.com/t/list-of-players-and-their-ottoneu-positions-player-universe/7547">
                Ottoneu Universe
              </Link>
              .
            </p>
            <UploadPlayerUniverse
              lastUploadedAt={lastUploadedUniverse?.updatedAt ?? null}
            />
          </section>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
