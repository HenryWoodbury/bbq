import { SectionCollapsible } from "@/components/section-collapsible"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { StatDefsTable } from "../stat-defs-table"

export const metadata = { title: "Reference — BBQ" }

export default async function AdminReferencePage() {
  await requireAdmin()

  const base = {
    where: { deletedAt: null },
    orderBy: { abbreviation: "asc" },
    select: { id: true, abbreviation: true, name: true, format: true },
  } as const

  const [batterStats, pitcherStats] = await Promise.all([
    prisma.statDefinition.findMany({
      ...base,
      where: { deletedAt: null, playerType: "BATTER" },
    }),
    prisma.statDefinition.findMany({
      ...base,
      where: { deletedAt: null, playerType: "PITCHER" },
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <h1>Reference</h1>

      <SectionCollapsible title="Batter Stats" size="md">
        <StatDefsTable data={batterStats} />
      </SectionCollapsible>

      <SectionCollapsible title="Pitcher Stats" size="md">
        <StatDefsTable data={pitcherStats} />
      </SectionCollapsible>
    </div>
  )
}
