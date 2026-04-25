"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type MenuFilterOption<T extends string> = {
  value: T
  icon: ReactNode
  label: string
}

interface MenuFilterGroupProps<T extends string> {
  options: MenuFilterOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: { padding: "p-1.5", minW: "min-w-8", tl: "rounded-tl-md", tr: "rounded-tr-md" },
  md: { padding: "p-2.5", minW: "min-w-10", tl: "rounded-tl-lg", tr: "rounded-tr-lg" },
  lg: { padding: "p-3.5", minW: "min-w-12", tl: "rounded-tl-xl", tr: "rounded-tr-xl" },
}

export function MenuFilterGroup<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: MenuFilterGroupProps<T>) {
  const last = options.length - 1
  const { padding, minW, tl, tr } = sizeConfig[size]

  return (
    <div className="border-border flex border-b">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          aria-label={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-1 items-center justify-center transition-colors",
            padding,
            minW,
            i === 0 && tl,
            i === last && tr,
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
