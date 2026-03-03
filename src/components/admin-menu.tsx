"use client";

import Link from "next/link";
import { SettingsIcon, UsersIcon, SlidersHorizontalIcon, BarChart2Icon, ChevronDownIcon } from "lucide-react";
import { BaseballIcon } from "@/components/icons/baseball-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Players", href: "/admin/players", icon: UsersIcon },
  { label: "Leagues", href: "/admin/leagues", icon: BaseballIcon },
  { label: "Reports", href: "/admin/reports", icon: BarChart2Icon },
  { label: "Settings", href: "/admin/settings", icon: SlidersHorizontalIcon },
] as const;

export function AdminMenu({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Admin menu"
          className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800", className)}
        >
          <SettingsIcon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">Admin</span>
          <ChevronDownIcon size={14} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        {ITEMS.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="flex items-center gap-2">
            <Link href={href} className="flex w-full items-center gap-2">
              <Icon size={15} className="shrink-0" />
              <span className="min-w-0 truncate">{label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
