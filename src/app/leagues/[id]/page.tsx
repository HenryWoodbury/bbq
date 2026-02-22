import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeaguePage({ params }: Props) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const league = await prisma.league.findFirst({
    where: { id, clerkOrgId: orgId, deletedAt: null },
    select: {
      leagueName: true,
      leagueFormat: true,
      fantasyPlatform: true,
      hostLeagueUrl: true,
      isAuction: true,
      isH2H: true,
      leagueCap: true,
      seasons: true,
      _count: { select: { members: true, teams: true } },
    },
  });

  if (!league) notFound();

  const latestSeason = league.seasons.length > 0 ? Math.max(...league.seasons) : null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard label="Format" value={league.leagueFormat ?? "—"} />
      <InfoCard label="Platform" value={league.fantasyPlatform ?? "—"} />
      <InfoCard label="Season" value={latestSeason?.toString() ?? "—"} />
      <InfoCard label="Teams" value={league._count.teams.toString()} />
      <InfoCard label="Members" value={league._count.members.toString()} />
      <InfoCard
        label="Type"
        value={[
          league.isAuction ? "Auction" : "Snake",
          league.isH2H ? "H2H" : "Roto",
        ].join(" · ")}
      />
      {league.isAuction && league.leagueCap != null && (
        <InfoCard label="Cap" value={`$${league.leagueCap}`} />
      )}
      {league.hostLeagueUrl && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Host League
          </p>
          <a
            href={league.hostLeagueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            {league.hostLeagueUrl}
          </a>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}
