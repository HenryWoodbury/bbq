import { cva, type VariantProps } from "class-variance-authority"
import type { InputHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "rounded-md border border-border bg-card text-body leading-[calc(4/3)] placeholder:text-muted-foreground focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
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
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>
}

function Input({ className, size, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input }
