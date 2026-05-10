"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Tab = "parks" | "park-factors" | "profiles"

export function ParkPageTabs({
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
    if (value === "parks") {
      p.delete("tab")
    } else {
      p.set("tab", value)
    }
    router.push(`?${p.toString()}`, { scroll: false })
  }

  return (
    <Tabs size="sm" value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="parks">Parks</TabsTrigger>
        <TabsTrigger value="park-factors">Park Factors</TabsTrigger>
        <TabsTrigger value="profiles">Profiles</TabsTrigger>
      </TabsList>
      <div className="mt-4">{children}</div>
    </Tabs>
  )
}
