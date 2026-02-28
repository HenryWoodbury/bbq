import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeagueMemberRole } from "@/generated/prisma/client";

// Extend Clerk session claims to include embedded publicMetadata.
// Requires Clerk Dashboard → Sessions → Customize session token:
//   { "metadata": "{{user.public_metadata}}" }
declare global {
  interface CustomJwtSessionClaims {
    metadata?: { role?: string };
  }
}

/** Returns true if the current session has admin role via session claims (no API call). */
export async function isAdminFromClaims(): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === "admin";
}

/** Page guard: redirects to / if unauthenticated or not admin. */
export async function requireAdmin(): Promise<void> {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") redirect("/");
}

/**
 * API route guard: returns a 401/403 NextResponse if the caller is not an admin.
 * Returns undefined when access is granted.
 * Usage: const denied = await assertAdmin(); if (denied) return denied;
 */
export async function assertAdmin(): Promise<NextResponse | undefined> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/**
 * Fetches the caller's LeagueMemberRole for the active org from Prisma.
 * Returns null if no league exists for the org or the user is not a member.
 */
export async function getLeagueRole(
  orgId: string,
  userId: string
): Promise<LeagueMemberRole | null> {
  const league = await prisma.league.findFirst({
    where: { clerkOrgId: orgId, deletedAt: null },
    select: { id: true },
  });
  if (!league) return null;

  const member = await prisma.leagueMember.findUnique({
    where: { clerkUserId_leagueId: { clerkUserId: userId, leagueId: league.id } },
    select: { role: true },
  });
  return member?.role ?? null;
}

/**
 * API route guard: returns a 403 NextResponse if the caller's league role is
 * not in the allowed set. Returns undefined when access is granted.
 * Usage: const denied = await assertLeagueRole(orgId, userId, [...]);
 *        if (denied) return denied;
 */
export async function assertLeagueRole(
  orgId: string,
  userId: string,
  allowed: LeagueMemberRole[]
): Promise<NextResponse | undefined> {
  const role = await getLeagueRole(orgId, userId);
  if (!role || !allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
