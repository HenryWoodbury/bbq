import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <span className="inline-grid">
      <select
        ref={ref}
        className={cn(
          "col-start-1 row-start-1 appearance-none rounded-md border border-border bg-card pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        size={14}
        className="pointer-events-none col-start-1 row-start-1 self-center justify-self-end mr-3 shrink-0 opacity-60"
      />
    </span>
  ),
)
Select.displayName = "Select"

export { Select }
