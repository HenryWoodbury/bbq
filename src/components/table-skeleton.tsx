import { Skeleton } from "@/components/ui/skeleton"

const SKELETON_ROW_KEYS = "abcdefghijklmnopqrstuvwxyz".split("")

export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="h-10 border-b border-border bg-muted/30" />
      {SKELETON_ROW_KEYS.slice(0, rows).map((key) => (
        <div
          key={key}
          className="flex gap-4 border-b border-border px-4 py-3 last:border-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}
