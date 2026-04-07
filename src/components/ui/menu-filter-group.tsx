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
}

export function MenuFilterGroup<T extends string>({
  options,
  value,
  onChange,
}: MenuFilterGroupProps<T>) {
  const last = options.length - 1

  return (
    <div className="border-border flex border-b">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          aria-label={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-1 items-center justify-center p-2.5 transition-colors min-w-10",
            i === 0 && "rounded-tl-lg",
            i === last && "rounded-tr-lg",
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
