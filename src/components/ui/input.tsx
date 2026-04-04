import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "rounded-lg border border-border bg-card text-body leading-[calc(4/3)] placeholder:text-muted-foreground focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "px-3 py-1",
        md: "px-3 py-1.5",
        lg: "px-3 py-[7px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
