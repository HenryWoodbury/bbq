import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { StatDefsTable } from "../StatDefsTable";

export const metadata = { title: "Manage Leagues — BBQ" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [statDefs] = await Promise.all([
    prisma.statDefinition.findMany({
      where: { deletedAt: null },
      orderBy: { abbreviation: "asc" },
      select: { id: true, abbreviation: true, name: true, format: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Stats Definitions
        </h2>
        <StatDefsTable data={statDefs} />
      </section>
    </div>
  );
}
