import { SectionCollapsible } from "@/components/section-collapsible"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { ExportsTable } from "../exports-table"
import { FormatsTable } from "../formats-table"

export const metadata = { title: "League Templates — BBQ" }

export default async function AdminTemplatesPage() {
  await requireAdmin()

  const [leagueFormats, dataExports] = await Promise.all([
    prisma.leagueFormat.findMany({
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
    }),
    prisma.dataExport.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, scope: true, type: true, fields: true },
    }),
  ])

  const exportRows = dataExports.map((e) => ({
    id: e.id,
    name: e.name,
    scope: e.scope,
    type: e.type,
    fields: e.fields,
  }))

  return (
    <div className="page-layout flex flex-col gap-4">
      <h1 className="page-title">Templates</h1>

      <SectionCollapsible title="Game Formats" size="md" defaultOpen={false}>
        <FormatsTable data={leagueFormats} />
      </SectionCollapsible>

      <SectionCollapsible title="Data Exports" size="md">
        <ExportsTable data={exportRows} />
      </SectionCollapsible>
    </div>
  )
}
