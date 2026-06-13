import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const alertVariants = cva("border", {
  variants: {
    variant: {
      success: "border-success-border bg-success text-foreground",
      error: "border-error-border bg-error text-foreground",
      warning: "border-warning-border bg-warning text-foreground",
      info: "border-border bg-muted text-foreground",
    },
    size: {
      sm: "rounded-sm px-3 py-2 text-sm",
      md: "rounded-md px-4 py-3 text-body",
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

function Alert({ className, variant, size, role, ...props }: AlertProps) {
  const defaultRole =
    variant === "error" || variant === "warning"
      ? "alert"
      : variant === "success" || variant === "info"
        ? "status"
        : undefined
  return (
    <div
      role={role ?? defaultRole}
      className={cn(alertVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Alert, alertVariants }
