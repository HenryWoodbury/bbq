import { auth, clerkClient } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return <WelcomePage />;
  }

  const clerk = await clerkClient();
  const memberships = await clerk.users.getOrganizationMembershipList({ userId });
  const orgIds = memberships.data.map((m) => m.organization.id);

  const leagues = orgIds.length
    ? await prisma.league.findMany({
        where: { clerkOrgId: { in: orgIds }, deletedAt: null },
        orderBy: { leagueName: "asc" },
        select: {
          id: true,
          clerkOrgId: true,
          leagueName: true,
          leagueFormat: true,
          seasons: true,
          _count: {
            select: {
              members: true,
              teams: { where: { deletedAt: null } },
            },
          },
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your leagues
        </h1>
      </section>

      {leagues.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;re not in any leagues yet. Create or join one via the org switcher in the
          header.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {leagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              active={league.clerkOrgId === orgId}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function WelcomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            BBQ
          </h1>
          <p className="max-w-prose text-lg text-zinc-500 dark:text-zinc-400">
            Fantasy baseball league management — drafts, rosters, and auction tools.
          </p>
        </div>
        <div className="flex gap-3">
          <SignUpButton mode="redirect">
            <button className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Get started
            </button>
          </SignUpButton>
          <SignInButton mode="redirect">
            <button className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
              Sign in
            </button>
          </SignInButton>
        </div>
      </section>
    </div>
  );
}

type LeagueSummary = {
  id: string;
  clerkOrgId: string;
  leagueName: string;
  leagueFormat: string | null;
  seasons: number[];
  _count: { members: number; teams: number };
};

function LeagueCard({ league, active }: { league: LeagueSummary; active: boolean }) {
  const currentSeason =
    league.seasons.length > 0 ? Math.max(...league.seasons) : null;

  return (
    <Link
      href="/league"
      className={`flex flex-col gap-4 rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md ${
        active
          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{league.leagueName}</h2>
        {active && (
          <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            Active
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Stat label="Format" value={league.leagueFormat ?? "—"} />
        <Stat label="Season" value={currentSeason?.toString() ?? "—"} />
        <Stat label="Teams" value={league._count.teams} />
        <Stat label="Members" value={league._count.members} />
      </dl>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-700 dark:text-zinc-300">{value}</dd>
    </div>
  );
}
