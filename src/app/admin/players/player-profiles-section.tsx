import Link from "next/link"
import type { UploadHistoryRow } from "@/app/admin/upload-history-panel"
import { UploadPlayerMap } from "../upload-player-map"
import { UploadPlayerUniverse } from "../upload-player-universe"

export function PlayerProfilesSection({
  playerMapUploads,
  playerUniverseUploads,
}: {
  playerMapUploads: UploadHistoryRow[]
  playerUniverseUploads: UploadHistoryRow[]
}) {

  return (
    <div className="mb-4">
      <section className="flex flex-col gap-3">
        <h2>Upload Player Map</h2>
        <p>
          Upload a CSV to map relevant fantasy players for a particular season.
        </p>
        <p>
          The player map must provide a unique ID and player name, and map to
          IDs of at least one public data source such as Fangraphs or MLB.
        </p>
        <UploadPlayerMap uploads={playerMapUploads} />
      </section>
      <section className="flex flex-col gap-3 mt-6">
        <h2>Import the Player Universe</h2>
        <p>
          Upload the list of all players in your{" "}
          <Link href="https://community.ottoneu.com/t/list-of-players-and-their-ottoneu-positions-player-universe/7547">
            Player Universe
          </Link>
          .
        </p>
        <UploadPlayerUniverse uploads={playerUniverseUploads} />
      </section>
    </div>
  )
}
