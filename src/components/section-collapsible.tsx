"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SectionCollapsibleProps {
  title: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SectionCollapsible({
  title,
  defaultOpen = true,
  children,
}: SectionCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer select-none items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
