"use client"

import Link from "next/link"
import { useState } from "react"
import { PlayerIcon } from "@/components/icons/player-icon"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { SyncPlayerMap } from "../sync-player-map"
import { UploadPlayerMap } from "../upload-player-map"
import { UploadPlayerUniverse } from "../upload-player-universe"
import type { SyncStatus } from "./page"
import { StatsSync } from "./stats-sync"

function profileStatusText(
  syncTs: Date | null | undefined,
  uploadTs: Date | null | undefined,
): string {
  if (!syncTs && !uploadTs) return "No player profiles."
  const isSyncMoreRecent =
    syncTs && (!uploadTs || new Date(syncTs) >= new Date(uploadTs))
  return isSyncMoreRecent
    ? `Last sync ${new Date(syncTs).toLocaleString()}`
    : `Last upload ${new Date(uploadTs!).toLocaleString()}`
}

export function PlayersSync({
  status,
  className,
}: {
  status: SyncStatus
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { lastSyncedPlayer, lastUploadedPlayerMap, lastUploadedUniverse } =
    status

  const profileStatus = profileStatusText(
    lastSyncedPlayer?.updatedAt,
    lastUploadedPlayerMap?.createdAt,
  )

  return (
    <div className={cn(className)}>
      <div className="flex items-center gap-4">
        <h2 className="min-w-36">Player Profiles</h2>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <PlayerIcon size={18} className="shrink-0" />
          <span className="min-w-0 truncate">Sync Players</span>
        </Button>
      </div>
      <p className="caption">{profileStatus}</p>

      <StatsSync status={status} className="mt-8" />

      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerContent side="right" width="w-170">
          <DrawerHeader onClose={() => setOpen(false)}>
            <DrawerTitle>Add Players</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <section className="pb-4 border-b border-border-zinc-200 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8">
              <h2 className="mb-2 text-xl font-normal">Sync Player IDs</h2>
              <p className="mb-2">
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
                className="mb-4"
              />
            </section>

            <section className="pt-6 pb-4">
              <h2 className="mb-2 text-xl font-normal">
                Import the Player Universe
              </h2>
              <p className="mb-2">
                Upload the full list of players in the{" "}
                <Link href="https://community.ottoneu.com/t/list-of-players-and-their-ottoneu-positions-player-universe/7547">
                  Ottoneu Universe
                </Link>
                .
              </p>
              <UploadPlayerUniverse
                lastUploadedAt={lastUploadedUniverse?.updatedAt ?? null}
                className="mb-4"
              />
            </section>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
