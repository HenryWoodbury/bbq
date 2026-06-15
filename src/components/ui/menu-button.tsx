import type { VariantProps } from "class-variance-authority"
import { ChevronDownIcon } from "@/components/icons/lucide"
import type { ButtonHTMLAttributes, Ref } from "react"
import { Button, type buttonVariants } from "@/components/ui/button"

interface MenuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<VariantProps<typeof buttonVariants>, "size"> {
  variant?: "ghost" | "secondary"
  ref?: Ref<HTMLButtonElement>
}

function MenuButton({
  variant = "ghost",
  size = "sm",
  className,
  children,
  ref,
  ...props
}: MenuButtonProps) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
      <ChevronDownIcon className="opacity-60" />
    </Button>
  )
}

export { MenuButton }
