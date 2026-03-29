"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface SectionCollapsibleProps {
  title: React.ReactNode
  size?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function SectionCollapsible({
  title,
  size = "sm",
  defaultOpen = true,
  children,
  className,
}: SectionCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const iconSize =
    size === "md" ? "h-4.5 w-4.5" : size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5"
  const fontSize =
    size === "md"
      ? "text-[1.0625rem] font-bold leading-[calc(4/3)]"
      : size === "lg"
        ? "text-xl font-bold leading-[calc(4/3)]"
        : "text-[0.9375rem] font-bold"

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger className="collapsible-trigger flex w-full cursor-pointer select-none items-center gap-1.5 text-foreground">
        <ChevronRight
          className={cn(
            "transition-transform duration-200",
            open && "rotate-90",
            iconSize,
          )}
        />
        <span className={fontSize}>{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
