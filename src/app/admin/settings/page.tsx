import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { StatDefsTable } from "../stat-defs-table";
import { SectionCollapsible } from "@/components/section-collapsible";

export const metadata = { title: "Settings — BBQ" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  const base = { where: { deletedAt: null }, orderBy: { abbreviation: "asc" }, select: { id: true, abbreviation: true, name: true, format: true } } as const;

  const [batterStats, pitcherStats] = await Promise.all([
    prisma.statDefinition.findMany({ ...base, where: { deletedAt: null, playerType: "BATTER" } }),
    prisma.statDefinition.findMany({ ...base, where: { deletedAt: null, playerType: "PITCHER" } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
      </section>

      <SectionCollapsible title="Batter Stats">
        <StatDefsTable data={batterStats} />
      </SectionCollapsible>

      <SectionCollapsible title="Pitcher Stats">
        <StatDefsTable data={pitcherStats} />
      </SectionCollapsible>
    </div>
  );
}
