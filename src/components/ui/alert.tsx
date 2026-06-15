"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { type HTMLAttributes, type ReactNode, useState } from "react"
import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "@/components/icons/lucide"
import { CloseButton } from "@/components/ui/close-button"
import { cn } from "@/lib/utils"

const alertVariants = cva("border", {
  variants: {
    variant: {
      // Variant colors mirror the Sonner toast mapping (src/components/ui/sonner.tsx).
      default: "bg-popover border-border text-foreground",
      success: "border-success-border bg-success text-foreground",
      error: "border-error-border bg-error text-foreground",
      warning: "border-warning-border bg-warning text-foreground",
      info: "bg-info border-info-border text-info-foreground",
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

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>

// Variant icons mirror the Sonner toast mapping (src/components/ui/sonner.tsx),
// tinted with each variant's foreground token for a subtle status signal.
// `default` (no variant) has no icon, matching the toast default.
const VARIANT_ICONS: Partial<Record<AlertVariant, ReactNode>> = {
  success: <CircleCheckIcon className="size-4 shrink-0 text-success-foreground" />,
  error: <CircleXIcon className="size-4 shrink-0 text-error-foreground" />,
  warning: <TriangleAlertIcon className="size-4 shrink-0 text-warning-foreground" />,
  info: <InfoIcon className="size-4 shrink-0 text-info-foreground" />,
}

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

  const resolvedVariant: AlertVariant = variant ?? "default"
  const defaultRole =
    resolvedVariant === "error" || resolvedVariant === "warning"
      ? "alert"
      : "status"
  const resolvedIcon = icon === false ? null : (icon ?? VARIANT_ICONS[resolvedVariant])
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
