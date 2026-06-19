import type { ComponentType } from "react"
import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "@/components/icons/lucide"

export type StatusVariant = "default" | "success" | "info" | "warning" | "error"

type StatusVariantConfig = {
  /** Container background + border + text classes. */
  container: string
  /** Status icon component, or `null` for `default` (no icon). */
  Icon: ComponentType<{ className?: string }> | null
  /** Icon classes, including the variant's foreground tint. */
  iconClass: string
}

// Single source of truth for status colors + icons, consumed by both Alert
// (alert.tsx) and the Sonner toast (sonner.tsx) so the two stay in sync.
export const STATUS_VARIANTS: Record<StatusVariant, StatusVariantConfig> = {
  default: {
    container: "bg-popover border-border text-foreground",
    Icon: null,
    iconClass: "",
  },
  success: {
    container: "bg-success border-success-border text-foreground",
    Icon: CircleCheckIcon,
    iconClass: "size-4 shrink-0 text-success-foreground",
  },
  info: {
    container: "bg-info border-info-border text-info-foreground",
    Icon: InfoIcon,
    iconClass: "size-4 shrink-0 text-info-foreground",
  },
  warning: {
    container: "bg-warning border-warning-border text-foreground",
    Icon: TriangleAlertIcon,
    iconClass: "size-4 shrink-0 text-warning-foreground",
  },
  error: {
    container: "bg-error border-error-border text-foreground",
    Icon: CircleXIcon,
    iconClass: "size-4 shrink-0 text-error-foreground",
  },
}
