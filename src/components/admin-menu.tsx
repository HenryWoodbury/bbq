"use client"

import {
  BarChart2Icon,
  BaseballIcon,
  LayoutTemplateIcon,
  ParkIcon,
  PlayerIcon,
  SettingsIcon,
  SquareLibraryIcon,
} from "@/components/icons"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"

const ITEMS = [
  { label: "Players", href: "/admin/players", icon: PlayerIcon },
  { label: "Parks", href: "/admin/parks", icon: ParkIcon },
  { label: "Leagues", href: "/admin/leagues", icon: BaseballIcon },
  { label: "Templates", href: "/admin/templates", icon: LayoutTemplateIcon },
  { label: "Reports", href: "/admin/reports", icon: BarChart2Icon },
  { label: "Reference", href: "/admin/reference", icon: SquareLibraryIcon },
] as const

export function AdminMenu({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuButton
          variant="ghost"
          size="sm"
          aria-label="Admin menu"
          className={className}
        >
          <SettingsIcon />
          <span className="min-w-0 truncate">Admin</span>
        </MenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        {ITEMS.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem
            key={href}
            asChild
            className="flex items-center gap-2"
          >
            <Link href={href} className="flex w-full items-center gap-2">
              <Icon />
              <span className="min-w-0 truncate">{label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
