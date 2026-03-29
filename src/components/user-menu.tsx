"use client"

import { useClerk } from "@clerk/nextjs"
import { FolderPen, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"

export type UserMenuLeague = {
  id: string
  leagueName: string
  clerkOrgId: string
}

export function UserMenu() {
  const { openUserProfile, signOut } = useClerk()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuButton
          variant="ghost"
          size="sm"
          aria-label="Manage account"
          className="max-w-60"
        >
          <User size={16} className="shrink-0" />
          <span className="min-w-0 truncate">You</span>
        </MenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <FolderPen />
          Manage account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
// import { ThemeToggle } from "./ui/theme-toggle"
// <ThemeToggle />
