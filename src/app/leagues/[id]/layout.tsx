import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function LeagueLayout({ children, params }: Props) {
  const { orgId } = await auth.protect();
  const { id } = await params;

  const league = await prisma.league.findFirst({
    where: { id, clerkOrgId: orgId, deletedAt: null },
    select: { id: true, leagueName: true },
  });

  if (!league) notFound();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {league.leagueName}
        </h1>
      </div>
      {children}
    </div>
  );
}
