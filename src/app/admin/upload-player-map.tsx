import { type UploadHistoryRow, UploadHistoryPanel } from "./upload-history-panel"

export type { UploadHistoryRow as PlayerMapUploadRow }

export function UploadPlayerMap({
  uploads,
  className,
}: {
  uploads: UploadHistoryRow[]
  className?: string
}) {
  return (
    <UploadHistoryPanel
      rows={uploads}
      uploadUrl="/api/players/import"
      deleteUrlBase="/api/admin/player-map-uploads"
      className={className}
    />
  )
}
