import type { VariantProps } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { Button, type buttonVariants } from "@/components/ui/button"

interface MenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<VariantProps<typeof buttonVariants>, "size"> {
  variant?: "ghost" | "secondary"
}

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ variant = "ghost", size = "sm", className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
      <ChevronDownIcon className="shrink-0 opacity-60" size={14} />
    </Button>
  ),
)
MenuButton.displayName = "MenuButton"

export { MenuButton }
