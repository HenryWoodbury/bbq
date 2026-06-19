"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { type HTMLAttributes, type ReactNode, useState } from "react"
import { CloseButton } from "@/components/ui/close-button"
import {
  STATUS_VARIANTS,
  type StatusVariant,
} from "@/components/ui/status-variants"
import { cn } from "@/lib/utils"

const alertVariants = cva("border", {
  variants: {
    // Colors come from the shared STATUS_VARIANTS source of truth.
    variant: {
      default: STATUS_VARIANTS.default.container,
      success: STATUS_VARIANTS.success.container,
      error: STATUS_VARIANTS.error.container,
      warning: STATUS_VARIANTS.warning.container,
      info: STATUS_VARIANTS.info.container,
    },
    size: {
      sm: "rounded-sm px-3 py-2 text-sm",
      md: "rounded-md px-4 py-3 text-body",
      lg: "rounded-lg px-5 py-4 text-body",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Override the variant icon, or pass `false` to render without one. */
  icon?: ReactNode | false
  /** Render a dismiss (×) button at the far right; clicking it hides the alert. */
  clearable?: boolean
  /** Called when the alert is dismissed via the clear button. */
  onClear?: () => void
}

function Alert({
  className,
  variant,
  size,
  role,
  icon,
  clearable = false,
  onClear,
  children,
  ...props
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const resolvedVariant: StatusVariant = variant ?? "default"
  const defaultRole =
    resolvedVariant === "error" || resolvedVariant === "warning"
      ? "alert"
      : "status"
  const { Icon, iconClass } = STATUS_VARIANTS[resolvedVariant]
  const variantIcon = Icon ? <Icon className={iconClass} /> : null
  const resolvedIcon = icon === false ? null : (icon ?? variantIcon)
  const handleClear = () => {
    setDismissed(true)
    onClear?.()
  }
  return (
    <div
      role={role ?? defaultRole}
      className={cn(alertVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {resolvedIcon && <span className="mt-0.5">{resolvedIcon}</span>}
        <div className="min-w-0 flex-1">{children}</div>
        {clearable && <CloseButton aria-label="Dismiss" onClick={handleClear} />}
      </div>
    </div>
  )
}

export { Alert, alertVariants }
