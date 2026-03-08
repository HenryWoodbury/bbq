"use client";

import { useRouter, usePathname } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { BaseballIcon } from "@/components/icons/baseball-icon";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserMenuLeague } from "./user-menu";

type Props = {
  leagues: UserMenuLeague[];
};

export function LeagueSelector({ leagues }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const currentLeague = leagues.find((l) => pathname?.startsWith(`/leagues/${l.id}`));
  const label = currentLeague?.leagueName ?? "Leagues";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="League selector" className="flex max-w-60 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <BaseballIcon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">{label}</span>
          <ChevronDownIcon size={14} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50 max-h-64 overflow-y-auto">
        {leagues.length === 0 ? (
          <div className="px-3 py-2 text-sm text-zinc-500">No leagues found</div>
        ) : (
          leagues.map((league) => {
            const isCurrent = league.id === currentLeague?.id;
            return (
              <DropdownMenuItem
                key={league.id}
                onClick={() => router.push(`/leagues/${league.id}`)}
                className="flex items-center gap-2"
              >
                <span className={cn("min-w-0 truncate", isCurrent && "font-semibold text-primary")}>
                  {league.leagueName}
                </span>
                {isCurrent && <CheckIcon size={14} className="shrink-0 ml-auto text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
