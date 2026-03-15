"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterGroupProps {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}

export function FilterGroup({
  label,
  options,
  value,
  onChange,
}: FilterGroupProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}:
      </span>
      <div className="flex overflow-hidden rounded-md border border-border">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-none px-2.5 py-1 text-xs",
              value === opt.value
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
