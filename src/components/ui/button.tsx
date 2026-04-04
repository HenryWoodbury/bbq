import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 border font-medium text-body leading-[calc(4/3)] transition-colors disabled:opacity-disabled disabled:cursor-not-allowed disabled:focus-visible:ring-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-lg border-zinc-950 bg-zinc-950 text-white enabled:hover:bg-zinc-750 enabled:hover:border-zinc-750 enabled:active:bg-zinc-750 enabled:active:border-zinc-950 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:enabled:hover:bg-zinc-300 dark:enabled:hover:border-zinc-300 dark:enabled:active:bg-zinc-300 dark:enabled:active:border-zinc-50",
        secondary:
          "rounded-lg border-zinc-300 bg-white text-zinc-950 enabled:hover:bg-zinc-150 enabled:hover:border-zinc-300 enabled:active:bg-zinc-150 enabled:active:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-700 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-500",
        destructive:
          "rounded-lg border-transparent text-destructive enabled:hover:bg-destructive/10",
        ghost:
          "rounded-lg border-transparent bg-transparent text-zinc-950 enabled:hover:bg-zinc-150 enabled:hover:border-zinc-150 enabled:active:bg-zinc-150 enabled:active:border-zinc-150 dark:text-zinc-50 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-750 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-750",
        subtle:
          "rounded-lg border-transparent text-muted-foreground enabled:hover:bg-zinc-150 enabled:hover:border-zinc-150 enabled:active:bg-zinc-150 enabled:active:border-zinc-150 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-750 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-750",
      },
      size: {
        sm: "px-3 py-1",
        md: "px-4 py-1.5",
        lg: "px-4 py-[7px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = "Button"

export { Button, buttonVariants }
