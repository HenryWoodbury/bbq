import { cache } from "react"
import { prisma } from "@/lib/prisma"

/**
 * Fetch a league by ID, deduplicated across the request render tree via React.cache().
 * Used by both layout.tsx (id, leagueName, clerkOrgId) and page.tsx (full detail).
 */
export const getLeagueById = cache((id: string) =>
  prisma.league.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      leagueName: true,
      clerkOrgId: true,
      hostLeagueUrl: true,
      seasons: true,
      _count: { select: { members: true, teams: true } },
      format: {
        select: {
          platform: true,
          playType: true,
          scoring: true,
          draftType: true,
          cap: true,
          rosterSize: true,
        },
      },
    },
  }),
)
