import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const metadata = { title: "Manage Leagues — BBQ" };

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reports
        </h1>
      </section>
    </div>
  );
}
