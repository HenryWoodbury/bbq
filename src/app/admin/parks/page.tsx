import { requireAdmin } from "@/lib/auth-helpers"
import { ParkPageTabs, type Tab } from "./park-page-tabs"

export const metadata = { title: "Manage Parks — BBQ" }

export default async function AdminParksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams

  const TABS: Tab[] = ["parks", "park-factors", "profiles"]
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "parks"

  return (
    <div className="page-layout">
      <h1>Manage Parks</h1>
      <ParkPageTabs currentTab={tab}>
        {tab === "parks" && <div />}
        {tab === "park-factors" && <div />}
        {tab === "profiles" && <div />}
      </ParkPageTabs>
    </div>
  )
}
