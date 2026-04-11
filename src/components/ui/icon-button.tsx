import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground disabled:opacity-30",
  {
    variants: {
      size: {
        sm: "p-1",
        md: "p-1.5",
        lg: "p-2",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
)

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  ref?: Ref<HTMLButtonElement>
}

function IconButton({ className, size, ref, ...props }: IconButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ size }), className)}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
