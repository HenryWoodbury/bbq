"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
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
        error: <OctagonXIcon className="size-4" />,
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

type ToastVariant = "default" | "success" | "info" | "warning" | "error"

type ToastAction = {
  label: string
  icon?: ReactNode
  onClick: () => void
  toastId: string | number
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "bg-popover border-border text-foreground",
  success: "bg-success border-success-border text-success-foreground",
  info:    "bg-info border-info-border text-info-foreground",
  warning: "bg-warning border-warning-border text-warning-foreground",
  error:   "bg-error border-error-border text-error-foreground",
}

const VARIANT_ICONS: Partial<Record<ToastVariant, ReactNode>> = {
  success: <CircleCheckIcon className="size-4 shrink-0" />,
  info:    <InfoIcon className="size-4 shrink-0" />,
  warning: <TriangleAlertIcon className="size-4 shrink-0" />,
  error:   <OctagonXIcon className="size-4 shrink-0" />,
}

function ToastContent({
  title,
  description,
  action,
  variant = "default",
}: {
  title?: string
  description?: string
  action?: ToastAction
  variant?: ToastVariant
}) {
  const icon = VARIANT_ICONS[variant]
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4 border rounded-md pt-3 pb-4 px-4",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="mt-0.5">{icon}</span>}
        <div className="min-w-0">
          {title && (
            <p className="text-body font-medium">{title}</p>
          )}
          {description && (
            <p className="text-body opacity-80">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              action.onClick()
              toast.dismiss(action.toastId)
            }}
          >
            {action.icon}
            {action.label}
          </Button>
          <IconButton
            size="sm"
            type="button"
            aria-label="Close"
            tooltip={false}
            onClick={() => toast.dismiss(action.toastId)}
            className="hover:bg-black/5 dark:hover:bg-white/10"
          >
            <XIcon />
          </IconButton>
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
  action?: Omit<ToastAction, "toastId">
  onDismiss?: () => void
  onAutoClose?: () => void
}

function showToast({
  title,
  description,
  variant,
  action,
  onDismiss,
  onAutoClose,
}: ShowToastOptions) {
  return toast.custom(
    (id) => (
      <ToastContent
        title={title}
        description={description}
        variant={variant}
        action={action ? { ...action, toastId: id } : undefined}
      />
    ),
    // Toasts with an action stay until the user resolves them (act or close).
    {
      onDismiss,
      onAutoClose,
      duration: action ? Number.POSITIVE_INFINITY : undefined,
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
