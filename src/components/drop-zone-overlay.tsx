"use client"

import { cn } from "@/lib/utils"

export function DropZoneOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none transition-opacity duration-150",
        "flex items-center justify-center",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-1.5 rounded-xl ring-2 ring-ring pointer-events-none" />
      <span className="rounded-lg bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow">
        Drop CSV files to upload
      </span>
    </div>
  )
}
