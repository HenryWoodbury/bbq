"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterGroupProps {
  label?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  size?: "md" | "sm"
}

export function FilterGroup({
  label,
  options,
  value,
  onChange,
  size = "sm",
}: FilterGroupProps) {
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-p font-normal text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex rounded-lg">
        {options.map((opt, i) => (
          <Button
            key={opt.value}
            type="button"
            variant={value === opt.value ? "primary" : "ghost"}
            size={size}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-none",
              i === 0 && "rounded-l-lg",
              i === options.length - 1 && "rounded-r-lg",
              i > 0 && "-ml-px",
              value === opt.value
                ? "relative z-10"
                : "border-border enabled:hover:border-zinc-300 text-muted-foreground enabled:hover:text-zinc-750 dark:enabled:hover:text-zinc-300",
              "focus-visible:relative focus-visible:z-10",
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
