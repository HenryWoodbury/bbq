import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center font-medium", {
  variants: {
    variant: {
      default: "bg-muted text-muted-foreground",
      warning: "bg-warning text-warning-foreground",
    },
    size: {
      sm: "rounded-md px-1 py-0.5 text-xs",
      md: "rounded-lg px-1.5 py-0.5 text-sm",
      lg: "rounded-xl px-2 py-1 text-body",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
