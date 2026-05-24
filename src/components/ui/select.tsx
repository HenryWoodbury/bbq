import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"
import type { Ref, SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const selectVariants = cva(
  "col-start-1 row-start-1 appearance-none border border-border bg-card text-foreground text-body leading-[calc(4/3)] focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "rounded-sm py-1 pl-3 pr-8 min-h-8",
        md: "rounded-md py-1.5 pl-3 pr-8 min-h-9",
        lg: "rounded-lg py-2 pl-3 pr-8 min-h-10",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  ref?: Ref<HTMLSelectElement>
  wrapperClassName?: string
}

function Select({ className, size, ref, wrapperClassName, ...props }: SelectProps) {
  return (
    <span className={cn("inline-grid", wrapperClassName)}>
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
  )
}

export { Select }
