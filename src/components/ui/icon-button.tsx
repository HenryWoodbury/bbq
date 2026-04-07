import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:hover:bg-zinc-300 dark:group-hover:hover:bg-zinc-600 disabled:opacity-30",
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
