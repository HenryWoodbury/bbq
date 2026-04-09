import { SectionCollapsible } from "@/components/section-collapsible"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { TemplatesTable } from "../templates-table"

export const metadata = { title: "League Templates — BBQ" }

export default async function AdminTemplatesPage() {
  await requireAdmin()

  const templates = await prisma.leagueTemplate.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      platform: true,
      playType: true,
      scoring: true,
      draftMode: true,
      draftType: true,
      teams: true,
      rosterSize: true,
      cap: true,
      rosters: true,
      isActive: true,
      version: true,
      description: true,
      rulesText: true,
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Templates</h1>

      <SectionCollapsible title="Game Formats" size="md" defaultOpen={false}>
        <p className="caption">Last update: 12345</p>
        <TemplatesTable data={templates} />
      </SectionCollapsible>

      <SectionCollapsible title="Data Exports" size="md" defaultOpen={false}>
        <p className="caption">Last update: 12345</p>
        <TemplatesTable data={templates} />
      </SectionCollapsible>
    </div>
  )
}
