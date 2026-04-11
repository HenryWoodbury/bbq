import { TableSkeleton } from "@/components/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Leagues</h1>
      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </section>
      <section>
        <h2 className="mb-3">Leagues</h2>
        <TableSkeleton rows={5} />
      </section>
    </div>
  )
}
