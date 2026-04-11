import { TableSkeleton } from "@/components/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="page-layout flex flex-col gap-4">
      <h1 className="page-title">Templates</h1>

      <section>
        <Skeleton className="h-5 w-32 mb-3" />
        <TableSkeleton rows={4} />
      </section>

      <section>
        <Skeleton className="h-5 w-32 mb-3" />
        <TableSkeleton rows={6} />
      </section>
    </div>
  )
}
