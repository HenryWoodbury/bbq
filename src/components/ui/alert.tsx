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
  },
  defaultVariants: {
    variant: "info",
  },
})

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props} />
  )
}

export { Alert, alertVariants }
