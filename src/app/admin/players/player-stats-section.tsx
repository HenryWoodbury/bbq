"use client"

import { useRouter } from "next/navigation"
import { UploadStats } from "../upload-stats"
import type { StatUploadRow } from "./page"

export function PlayerStatsSection({
  recentStatUploads,
}: {
  recentStatUploads: StatUploadRow[]
}) {
  const router = useRouter()

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/stat-uploads/${id}`, {
      method: "DELETE",
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="mb-4">
      <section className="flex flex-col gap-3">
        <h2>Upload Player Stats</h2>
        <p>
          Each set of player stats is a single CSV upload for batter or pitcher
          by year, actual or projected.
        </p>
        <UploadStats
          existingUploads={recentStatUploads}
          onDelete={handleDelete}
        />
      </section>
    </div>
  )
}
