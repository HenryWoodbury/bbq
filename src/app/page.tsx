import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function HomePage() {
  const { userId, orgId, orgSlug } = await auth();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          BBQ
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Fantasy baseball draft and league management
        </p>
      </section>

      {userId && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <DashboardCard
            title="League"
            description={
              orgId ? `Managing ${orgSlug ?? orgId}` : "Join or create a league via the org switcher"
            }
            href={orgId ? "/league" : "#"}
          />
          <DashboardCard
            title="Players"
            description="Browse the player universe and stats"
            href="/players"
          />
          <DashboardCard
            title="Teams"
            description="Manage your roster and transactions"
            href="/teams"
          />
          <DashboardCard
            title="Draft"
            description="Auction or snake draft room"
            href="/draft"
          />
        </section>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </Link>
  );
}
