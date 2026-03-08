import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { isAdminFromClaims } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { AdminMenu } from "./admin-menu"
import { LeagueSelector } from "./league-selector"
import { Button } from "./ui/button"
import { UserMenu, type UserMenuLeague } from "./user-menu"

export async function Header() {
  const { userId } = await auth()

  let leagues: UserMenuLeague[] = []
  let isAdmin = false

  if (userId) {
    ;[leagues, isAdmin] = await Promise.all([
      prisma.league.findMany({
        where: { members: { some: { clerkUserId: userId } }, deletedAt: null },
        select: { id: true, leagueName: true, clerkOrgId: true },
        orderBy: { leagueName: "asc" },
      }),
      isAdminFromClaims(),
    ])
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          BBQ
        </Link>

        <div className="flex items-center gap-2">
          <ClerkLoading>
            {userId && (
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            )}
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <LeagueSelector leagues={leagues} />
              {isAdmin && <AdminMenu className="mr-2" />}
              <UserMenu />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <Button>Sign in</Button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  )
}
