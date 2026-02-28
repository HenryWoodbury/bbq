import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdminFromClaims } from "@/lib/auth-helpers";
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserMenu, type UserMenuLeague } from "./user-menu";
import { LeagueSelector } from "./league-selector";

export async function Header() {
  const { userId } = await auth();

  let leagues: UserMenuLeague[] = [];
  let isAdmin = false;

  if (userId) {
    const clerk = await clerkClient();
    const [orgMemberships, adminFlag] = await Promise.all([
      clerk.users.getOrganizationMembershipList({ userId }),
      isAdminFromClaims(),
    ]);

    const clerkOrgs = orgMemberships.data.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
    }));

    if (clerkOrgs.length > 0) {
      // Ensure a League row exists for every Clerk org (idempotent — Clerk is source of truth)
      await prisma.league.createMany({
        data: clerkOrgs.map((org) => ({
          clerkOrgId: org.id,
          leagueName: org.name,
          rosterConfig: {},
          seasons: [],
        })),
        skipDuplicates: true,
      });

      leagues = await prisma.league.findMany({
        where: { clerkOrgId: { in: clerkOrgs.map((o) => o.id) }, deletedAt: null },
        select: { id: true, leagueName: true, clerkOrgId: true },
      });
    }

    isAdmin = adminFlag;
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

        <div className="flex items-center gap-4">
          <ClerkLoading>
            {userId && (
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            )}
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <LeagueSelector leagues={leagues} />
              <UserMenu isAdmin={isAdmin} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
}
