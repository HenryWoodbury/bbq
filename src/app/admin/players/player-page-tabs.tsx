"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Tab = "players" | "stats" | "profiles"

export function PlayerPageTabs({
  currentTab,
  children,
}: {
  currentTab: Tab
  children: ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleTabChange(value: string) {
    const p = new URLSearchParams(searchParams)
    p.delete("pp")
    p.delete("ps")
    if (value === "players") {
      p.delete("tab")
    } else {
      p.set("tab", value)
    }
    router.push(`?${p.toString()}`, { scroll: false })
  }

  return (
    <Tabs size="sm" value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="players">Players</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
      </TabsList>
      <div className="mt-4">{children}</div>
    </Tabs>
  )
}
