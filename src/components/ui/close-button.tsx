import { XIcon } from "@/components/icons/lucide"
import { IconButton, type IconButtonProps } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

/**
 * Dismiss (×) button shared by Alert and Toast: an icon button styled to sit
 * flush at the top-right and tint its hover against any (incl. colored) surface.
 * Pass `aria-label` (e.g. "Dismiss" / "Close") and `onClick`.
 */
function CloseButton({
  className,
  ...props
}: Omit<IconButtonProps, "children" | "tooltip">) {
  return (
    <IconButton
      type="button"
      size="sm"
      tooltip={false}
      className={cn("-mr-1 hover:bg-black/5 dark:hover:bg-white/10", className)}
      {...props}
    >
      <XIcon />
    </IconButton>
  )
}

export { CloseButton }
