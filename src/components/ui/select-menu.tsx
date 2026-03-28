"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"

interface SelectMenuOption {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  onChange: (value: string) => void
  options: SelectMenuOption[]
  size?: "sm" | "md"
  variant?: "ghost" | "secondary"
  placeholder?: string
  className?: string
}

function SelectMenu({
  value,
  onChange,
  options,
  size = "sm",
  variant = "secondary",
  placeholder = "Select…",
  className,
}: SelectMenuProps) {
  const current = options.find((o) => o.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuButton variant={variant} size={size} className={className}>
          {current?.label ?? placeholder}
        </MenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={opt.value === value}
            onCheckedChange={() => onChange(opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { SelectMenu, type SelectMenuOption }
