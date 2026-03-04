import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrgSync } from "@/components/org-sync";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function LeagueLayout({ children, params }: Props) {
  const { userId } = await auth.protect();
  const { id } = await params;

  const league = await prisma.league.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, leagueName: true, clerkOrgId: true },
  });
  if (!league) notFound();

  const member = await prisma.leagueMember.findUnique({
    where: { clerkUserId_leagueId: { clerkUserId: userId, leagueId: league.id } },
    select: { role: true },
  });
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <OrgSync clerkOrgId={league.clerkOrgId} />
      <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {league.leagueName}
        </h1>
      </div>
      {children}
    </div>
  );
}
