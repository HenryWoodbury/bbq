import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "./page"

export default function Loading() {
  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Players</h1>
      <section className="mt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      </section>
      <section className="mt-6">
        <TableSkeleton rows={10} />
      </section>
    </div>
  )
}
