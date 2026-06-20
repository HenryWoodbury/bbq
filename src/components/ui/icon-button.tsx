"use client"

import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground disabled:opacity-disabled disabled:cursor-not-allowed disabled:focus-visible:ring-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        // Muted at rest (from the base), destructive red on hover.
        destructive:
          "hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/10",
      },
      size: {
        sm: "rounded-sm p-1 [&_svg]:size-3.5",
        md: "rounded-md p-1.5 [&_svg]:size-4",
        lg: "rounded-lg p-2 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
)

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  ref?: Ref<HTMLButtonElement>
  "aria-label": string
  /** Tooltip content. Defaults to `aria-label`. Pass `false` to disable (e.g. when the
   * button is itself an external Radix `asChild` trigger and the tooltip is nested outside). */
  tooltip?: ReactNode | false
  tooltipSide?: "top" | "right" | "bottom" | "left"
}

function IconButton({
  className,
  variant,
  size,
  ref,
  tooltip,
  tooltipSide = "top",
  ...props
}: IconButtonProps) {
  const button = (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  const content = tooltip === undefined ? props["aria-label"] : tooltip
  if (!content) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>{content}</TooltipContent>
    </Tooltip>
  )
}

export { IconButton, iconButtonVariants }
