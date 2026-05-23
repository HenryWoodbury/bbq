import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterGroupProps {
  label?: string
  options: { value: string; label: ReactNode }[]
  value: string
  onChange: (v: string) => void
  size?: "sm" | "md" | "lg"
}

const cornerRadius = {
  sm: { l: "rounded-l-md", r: "rounded-r-md" },
  md: { l: "rounded-l-lg", r: "rounded-r-lg" },
  lg: { l: "rounded-l-xl", r: "rounded-r-xl" },
}

export function FilterGroup({
  label,
  options,
  value,
  onChange,
  size = "md",
}: FilterGroupProps) {
  const { l, r } = cornerRadius[size]
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-body font-normal text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex">
        {options.map((opt, i) => (
          <Button
            key={opt.value}
            type="button"
            variant={value === opt.value ? "primary" : "ghost"}
            size={size}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-none",
              i === 0 && l,
              i === options.length - 1 && r,
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
