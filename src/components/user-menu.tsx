"use client"

import type { ReactNode } from "react"
import { useClerk } from "@clerk/nextjs"
import { FolderPenIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react"
import { useTheme, type Theme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"
import { MenuFilterGroup } from "@/components/ui/menu-filter-group"

export type UserMenuLeague = {
  id: string
  leagueName: string
  clerkOrgId: string
}

const THEME_OPTIONS: { value: Theme; icon: ReactNode; label: string }[] = [
  { value: "system", icon: <MonitorIcon size={16} />, label: "System" },
  { value: "light", icon: <SunIcon size={16} />, label: "Light" },
  { value: "dark", icon: <MoonIcon size={16} />, label: "Dark" },
]

export function UserMenu() {
  const { openUserProfile, signOut } = useClerk()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuButton
          variant="ghost"
          size="sm"
          aria-label="Manage account"
          className="max-w-60"
        >
          <UserIcon size={16} className="shrink-0" />
          <span className="min-w-0 truncate">You</span>
        </MenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="overflow-hidden p-0">
        <MenuFilterGroup options={THEME_OPTIONS} value={theme} onChange={setTheme} />
        <div className="p-1">
          <DropdownMenuItem onClick={() => openUserProfile()}>
            <FolderPenIcon />
            Manage account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
