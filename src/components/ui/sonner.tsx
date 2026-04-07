"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

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

type ToastAction = {
  label: string
  icon?: ReactNode
  onClick: () => void
  toastId: string | number
}

function ToastContent({
  title,
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ToastAction
}) {
  return (
    <div className="flex w-full items-end justify-between gap-4 border border-border rounded-md pt-3 pb-4 px-4">
      <div className="min-w-0">
        {title && (
          <p className="text-body font-medium text-foreground">{title}</p>
        )}
        {description && (
          <p className="mt-0.5 text-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => {
            toast.dismiss(action.toastId)
            action.onClick()
          }}
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ── showToast ─────────────────────────────────────────────────────────────────

type ShowToastOptions = {
  title: string
  description?: string
  action?: Omit<ToastAction, "toastId">
  onDismiss?: () => void
  onAutoClose?: () => void
}

function showToast({
  title,
  description,
  action,
  onDismiss,
  onAutoClose,
}: ShowToastOptions) {
  return toast.custom(
    (id) => (
      <ToastContent
        title={title}
        description={description}
        action={action ? { ...action, toastId: id } : undefined}
      />
    ),
    { onDismiss, onAutoClose },
  )
}

showToast.error = (title: string, description?: string) =>
  toast.error(title, { description })

export { showToast, Toaster }
