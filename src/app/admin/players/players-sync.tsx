"use client"

import Link from "next/link"
import { useState } from "react"
import { PlayerIcon } from "@/components/icons/player-icon"
import { SectionCollapsible } from "@/components/section-collapsible"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SyncPlayers } from "../sync-players"
import { UploadPlayerUniverse } from "../upload-player-universe"
import { UploadStats } from "../upload-stats"
import type { SyncStatus } from "./page"

export function PlayersSync({ status }: { status: SyncStatus }) {
  const [open, setOpen] = useState(false)
  const { lastSyncedPlayer, lastUploadedUniverse, lastUploadedStats } = status
  return (
    <>
      <div className="flex gap-4">
        <h2>Player Profiles</h2>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <PlayerIcon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">Add Players</span>
        </Button>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerContent side="right" width="w-200">
          <DrawerHeader onClose={() => setOpen(false)}>
            <DrawerTitle>Add Players</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <section>
              <h2 className="mb-1">Sync Player IDs</h2>
              <p className="mb-4">
                Fetches the{" "}
                <Link href="https://www.smartfantasybaseball.com/tools/">
                  Smart Fantasy Baseball Player ID Map
                </Link>{" "}
                then upserts all players.
              </p>
              <SyncPlayers lastSyncedAt={lastSyncedPlayer?.updatedAt ?? null} />
            </section>

            <section>
              <h2 className="mb-1">Import the Ottoneu Player Universe</h2>
              <p className="mb-4">
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

            <section>
              <SectionCollapsible
                title={<h2>Upload Stats</h2>}
                defaultOpen={false}
              >
                <p className="mb-4">
                  Upload a Fangraphs-format CSV (e.g. Steamer, ZiPS) and tag it
                  with season, projected, neutralized, and split metadata.
                </p>
                <UploadStats
                  lastUploadedAt={lastUploadedStats?.updatedAt ?? null}
                />
              </SectionCollapsible>
            </section>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
