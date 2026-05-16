import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 border font-medium text-body leading-[calc(4/3)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed disabled:focus-visible:ring-0 [&_svg]:size-[1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border-zinc-950 bg-zinc-950 text-white enabled:hover:bg-zinc-750 enabled:hover:border-zinc-750 enabled:active:bg-zinc-750 enabled:active:border-zinc-950 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:enabled:hover:bg-zinc-300 dark:enabled:hover:border-zinc-300 dark:enabled:active:bg-zinc-300 dark:enabled:active:border-zinc-50",
        secondary:
          "border-zinc-300 bg-white text-zinc-950 enabled:hover:bg-zinc-150 enabled:hover:border-zinc-300 enabled:active:bg-zinc-150 enabled:active:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-700 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-500",
        destructive:
          "border-transparent text-destructive enabled:hover:bg-destructive/10",
        ghost:
          "border-transparent bg-transparent text-zinc-950 enabled:hover:bg-zinc-150 enabled:hover:border-zinc-150 enabled:active:bg-zinc-150 enabled:active:border-zinc-150 dark:text-zinc-50 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-750 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-750",
        subtle:
          "border-transparent text-muted-foreground enabled:hover:bg-zinc-150 enabled:hover:border-zinc-150 enabled:active:bg-zinc-150 enabled:active:border-zinc-150 dark:enabled:hover:bg-zinc-750 dark:enabled:hover:border-zinc-750 dark:enabled:active:bg-zinc-750 dark:enabled:active:border-zinc-750",
      },
      size: {
        sm: "rounded-md px-3 py-1 min-h-8",
        md: "rounded-lg px-4 py-1.5 min-h-9",
        lg: "rounded-xl px-4 py-2 min-h-10",
      },
      mode: {
        icon: "px-0 aspect-square",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  ref?: Ref<HTMLButtonElement>
}

function Button({ className, variant, size, mode, ref, ...props }: ButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, mode }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
