"use client"

import { usePathname, useRouter } from "next/navigation"
import { BaseballIcon } from "@/components/icons/baseball-icon"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"
import type { UserMenuLeague } from "./user-menu"

type Props = {
  leagues: UserMenuLeague[]
}

export function LeagueSelector({ leagues }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const currentLeague = leagues.find((l) =>
    pathname?.startsWith(`/leagues/${l.id}`),
  )
  const label = currentLeague?.leagueName ?? "Leagues"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuButton variant="ghost" size="sm" aria-label="League selector" className="max-w-60">
          <BaseballIcon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">{label}</span>
        </MenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50 max-h-64 overflow-y-auto">
        {leagues.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No leagues found
          </div>
        ) : (
          leagues.map((league) => (
            <DropdownMenuCheckboxItem
              key={league.id}
              checked={league.id === currentLeague?.id}
              onCheckedChange={() => router.push(`/leagues/${league.id}`)}
            >
              <span className="min-w-0 truncate">{league.leagueName}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
