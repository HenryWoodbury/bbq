import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { OrgSync } from "@/components/org-sync"
import { prisma } from "@/lib/prisma"
import { getLeagueById } from "@/lib/queries/leagues"

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function LeagueLayout({ children, params }: Props) {
  const { userId } = await auth.protect()
  const { id } = await params

  const league = await getLeagueById(id)
  if (!league) notFound()

  const member = await prisma.leagueMember.findUnique({
    where: {
      clerkUserId_leagueId: { clerkUserId: userId, leagueId: league.id },
    },
    select: { role: true },
  })
  if (!member) notFound()

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <OrgSync clerkOrgId={league.clerkOrgId} />
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="page-title">{league.leagueName}</h1>
      </div>
      {children}
    </div>
  )
}
