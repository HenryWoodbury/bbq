import type { LabelHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/utils"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  ref?: Ref<HTMLLabelElement>
}

function Label({ className, ref, ...props }: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-normal text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Label }
