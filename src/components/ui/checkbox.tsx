import { cva, type VariantProps } from "class-variance-authority"
import type { InputHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "border border-border bg-card accent-primary focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5 rounded-sm",
        md: "h-4 w-4 rounded-md",
        lg: "h-5 w-5 rounded-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  ref?: Ref<HTMLInputElement>
}

function Checkbox({ className, size, ref, ...props }: CheckboxProps) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    />
  )
}

export { Checkbox }
