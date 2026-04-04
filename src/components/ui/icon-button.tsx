import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:hover:bg-zinc-300 dark:group-hover:hover:bg-zinc-600 disabled:opacity-30",
  {
    variants: {
      size: {
        md: "p-1.5",
        sm: "p-1",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ size }), className)}
      {...props}
    />
  ),
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
