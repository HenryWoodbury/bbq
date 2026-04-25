import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      success: "border-success-border bg-success text-success-foreground",
      error: "border-error-border bg-error text-error-foreground",
      warning: "border-warning-border bg-warning text-warning-foreground",
      info: "border-border bg-muted text-foreground",
    },
    size: {
      sm: "rounded-sm px-3 py-2 text-xs",
      md: "rounded-md px-4 py-3 text-sm",
      lg: "rounded-lg px-5 py-4 text-body",
    },
  },
  defaultVariants: {
    variant: "info",
    size: "md",
  },
})

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, size, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant, size }), className)} {...props} />
  )
}

export { Alert, alertVariants }
