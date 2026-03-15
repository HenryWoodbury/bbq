"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
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
      <CollapsibleTrigger className="collapsible-trigger flex w-full cursor-pointer select-none items-center gap-1.5">
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
