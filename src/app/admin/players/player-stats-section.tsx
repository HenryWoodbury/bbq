"use client"

import { useRouter } from "next/navigation"
import { UploadStats } from "../upload-stats"
import type { StatUploadRow } from "./page"

/*
  Regarding direct scraping of data: Fangraphs only accepts CSV downloads:
  Outside of one click data exports for FanGraphs Members, we do not support exporting 
  data in any other way. We do not support web scraping, API endpoints, importing data 
  automatically to Excel or Google Sheets, web queries, etc….
  https://blogs.fangraphs.com/contact/
*/

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
