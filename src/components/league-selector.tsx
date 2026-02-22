"use client";

import { useOrganization, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { BaseballIcon } from "@/components/icons/baseball-icon";
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
  const { organization } = useOrganization();
  const { setActive } = useClerk();
  const router = useRouter();

  const activeLeague = leagues.find((l) => l.clerkOrgId === organization?.id);

  async function selectLeague(league: UserMenuLeague) {
    await setActive({ organization: league.clerkOrgId });
    router.push(`/leagues/${league.id}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex max-w-60 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <BaseballIcon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">{activeLeague?.leagueName ?? "My Leagues"}</span>
          <ChevronDownIcon size={14} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 max-h-64 overflow-y-auto">
        {leagues.length === 0 ? (
          <div className="px-3 py-2 text-sm text-zinc-500">No leagues found</div>
        ) : (
          leagues.map((league) => {
            const isActive = league.clerkOrgId === organization?.id;
            return (
              <DropdownMenuItem
                key={league.id}
                onClick={() => selectLeague(league)}
                className="flex items-center gap-2"
              >
                <span className={`min-w-0 truncate ${isActive ? "font-semibold text-primary" : ""}`}>
                  {league.leagueName}
                </span>
                {isActive && <CheckIcon size={14} className="shrink-0 ml-auto text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
