import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="page-layout flex flex-col gap-4">
      <h1>Manage Parks</h1>
      <section className="mt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-20" />
        </div>
      </section>
    </div>
  )
}
