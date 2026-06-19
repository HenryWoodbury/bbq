import type { ReactNode, SVGProps } from "react"
import { cn } from "@/lib/utils"

export interface IconProps extends SVGProps<SVGSVGElement> {
  /**
   * Pixel size, mirroring lucide-react (default 24). In practice icons are
   * sized via `className="size-4"` or a parent `[&_svg]:size-*` rule.
   */
  size?: number | string
}

/**
 * Builds an icon component that matches lucide-react's render contract — a
 * 24-unit viewBox, `currentColor` stroke, numeric `size` (default 24), and
 * className merge — so our custom SVG icons behave as drop-in siblings of the
 * re-exported lucide icons. Each icon file supplies only its inner paths.
 */
export function createIcon(displayName: string, children: ReactNode) {
  function Icon({ size = 24, strokeWidth = 2, className, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("shrink-0", className)}
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    )
  }
  Icon.displayName = displayName
  return Icon
}
