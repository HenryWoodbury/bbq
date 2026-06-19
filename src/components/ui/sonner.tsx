"use client"

import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "@/components/icons/lucide"
import type { CSSProperties, ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { CloseButton } from "@/components/ui/close-button"
import {
  STATUS_VARIANTS,
  type StatusVariant,
} from "@/components/ui/status-variants"
import { cn } from "@/lib/utils"

// ── Toaster ───────────────────────────────────────────────────────────────────

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <CircleXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--width": "380px",
        } as CSSProperties
      }
      {...props}
    />
  )
}

// ── ToastContent ──────────────────────────────────────────────────────────────

// Re-exported alias for the shared status variant (kept for call sites that
// import `ToastVariant` from here).
type ToastVariant = StatusVariant

type ToastAction = {
  label: string
  icon?: ReactNode
  onClick: () => void
}

function ToastContent({
  title,
  description,
  action,
  variant = "default",
  toastId,
  showClose = false,
}: {
  title?: string
  description?: string
  action?: ToastAction
  variant?: ToastVariant
  toastId: string | number
  /** Render a manual close (×); used for toasts that don't auto-close. */
  showClose?: boolean
}) {
  const { Icon, iconClass, container } = STATUS_VARIANTS[variant]
  return (
    <div
      className={cn(
        "flex w-full items-start justify-between gap-4 border rounded-md pt-3 pb-4 px-4",
        container,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="mt-0.5">
            <Icon className={iconClass} />
          </span>
        )}
        <div className="min-w-0">
          {title && (
            <p className="text-body font-medium">{title}</p>
          )}
          {description && (
            <p className="text-body opacity-80">{description}</p>
          )}
        </div>
      </div>
      {(action || showClose) && (
        <div className="flex shrink-0 items-start gap-1">
          {action && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                action.onClick()
                toast.dismiss(toastId)
              }}
            >
              {action.icon}
              {action.label}
            </Button>
          )}
          {showClose && (
            <CloseButton
              aria-label="Close"
              onClick={() => toast.dismiss(toastId)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── showToast ─────────────────────────────────────────────────────────────────

type ShowToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  action?: ToastAction
  /** Keep the toast open until the user dismisses it (renders a × close). */
  persistent?: boolean
  onDismiss?: () => void
  onAutoClose?: () => void
}

function showToast({
  title,
  description,
  variant,
  action,
  persistent,
  onDismiss,
  onAutoClose,
}: ShowToastOptions) {
  // A toast that won't auto-close — because it has an action to resolve or is
  // explicitly persistent — gets a manual close (×). Auto-closing toasts dismiss
  // themselves, so they show no ×.
  const noAutoClose = persistent === true || action != null
  return toast.custom(
    (id) => (
      <ToastContent
        title={title}
        description={description}
        variant={variant}
        action={action}
        toastId={id}
        showClose={noAutoClose}
      />
    ),
    {
      onDismiss,
      onAutoClose,
      duration: noAutoClose ? Number.POSITIVE_INFINITY : undefined,
    },
  )
}

showToast.success = (title: string, description?: string) =>
  showToast({ title, description, variant: "success" })

showToast.info = (title: string, description?: string) =>
  showToast({ title, description, variant: "info" })

showToast.warning = (title: string, description?: string) =>
  showToast({ title, description, variant: "warning" })

showToast.error = (title: string, description?: string) =>
  showToast({ title, description, variant: "error" })

export { showToast, Toaster }
export type { ToastVariant }
