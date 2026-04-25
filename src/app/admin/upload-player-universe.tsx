import { type UploadHistoryRow, UploadHistoryPanel } from "./upload-history-panel"

export type { UploadHistoryRow as PlayerUniverseUploadRow }

export function UploadPlayerUniverse({
  uploads,
  className,
}: {
  uploads: UploadHistoryRow[]
  className?: string
}) {
  return (
    <UploadHistoryPanel
      rows={uploads}
      uploadUrl="/api/admin/upload-universe"
      deleteUrlBase="/api/admin/player-universe-uploads"
      className={className}
    />
  )
}
