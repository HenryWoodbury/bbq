import { cva, type VariantProps } from "class-variance-authority"
import type { Ref, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "border border-border bg-card px-3 placeholder:text-muted-foreground focus:outline-none not-disabled:focus:ring-2 not-disabled:focus:ring-ring disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "rounded-sm py-1 text-sm",
        md: "rounded-md py-1.5 text-sm",
        lg: "rounded-lg py-2 text-body",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  ref?: Ref<HTMLTextAreaElement>
}

function Textarea({ className, size, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
