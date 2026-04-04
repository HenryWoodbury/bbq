import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"

const selectVariants = cva(
  "col-start-1 row-start-1 appearance-none rounded-md border border-border bg-card text-body leading-[calc(4/3)] focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "pl-3 pr-8 py-1",
        md: "pl-3 pr-8 py-1.5",
        lg: "pl-3 pr-8 py-[7px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, ...props }, ref) => (
    <span className="inline-grid">
      <select
        ref={ref}
        className={cn(selectVariants({ size }), className)}
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
