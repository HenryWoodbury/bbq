"use client"

import { cva } from "class-variance-authority"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type MenuFilterOption<T extends string> = {
  value: T
  icon: ReactNode
  label: string
}

interface MenuFilterGroupProps<T extends string> {
  label: string
  options: MenuFilterOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: "sm" | "md" | "lg"
}

const filterButtonVariants = cva(
  "flex flex-1 items-center justify-center transition-colors",
  {
    variants: {
      size: {
        sm: "p-1.5 min-w-8",
        md: "p-2.5 min-w-10",
        lg: "p-3.5 min-w-12",
      },
    },
  },
)

const CORNER_ROUNDING = {
  sm: { first: "rounded-tl-md", last: "rounded-tr-md" },
  md: { first: "rounded-tl-lg", last: "rounded-tr-lg" },
  lg: { first: "rounded-tl-xl", last: "rounded-tr-xl" },
}

export function MenuFilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: MenuFilterGroupProps<T>) {
  const last = options.length - 1
  const base = filterButtonVariants({ size })
  const corners = CORNER_ROUNDING[size]

  return (
    <div role="group" aria-label={label} className="border-border flex border-b">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            base,
            i === 0 && corners.first,
            i === last && corners.last,
            value === opt.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-zinc-150 dark:hover:bg-zinc-800 hover:text-foreground",
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
