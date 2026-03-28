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
import { ThemeToggle } from "./ui/theme-toggle"
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
    <header className="site-header">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="logo"
        >
          BBQ
        </Link>

        <div className="flex items-center gap-2">
          <ClerkLoading>
            {userId && (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            )}
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <LeagueSelector leagues={leagues} />
              {isAdmin && <AdminMenu className="mr-2" />}
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <Button>Sign in</Button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
          <ThemeToggle />
          <ClerkLoaded>
            <SignedIn>
              <UserMenu />
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  )
}
