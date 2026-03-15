# Authentication & Authorization

## Overview

Auth is handled by **Clerk** with **Next.js 16 proxy** pattern. All auth logic flows through `src/proxy.ts` and `src/lib/auth-helpers.ts`.

---

## Next.js 16 Proxy (`src/proxy.ts`)

Next.js 16 loads `src/proxy.ts` natively as middleware — no `middleware.ts` re-export needed.

```ts
// src/proxy.ts
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
```

### Public routes

| Route | Reason |
|---|---|
| `/` | Landing page |
| `/sign-in(.*)` | Clerk sign-in flow |
| `/sign-up(.*)` | Clerk sign-up flow |
| `/api/webhooks(.*)` | Clerk webhook receiver |

All other routes require an active Clerk session.

---

## API Route Auth (`auth.protect()`)

Every non-public API route handler calls `await auth.protect()` at the top. This throws if unauthenticated (Clerk redirects or returns 401).

```ts
export async function GET() {
  const { userId } = await auth.protect()
  // userId is the Clerk user ID — never null here
}
```

---

## Auth Helpers (`src/lib/auth-helpers.ts`)

### `assertAdmin()`

Checks `sessionClaims.metadata.role === "admin"` (no DB query — fast). Returns a `NextResponse` (401/403) if denied, `undefined` if allowed.

**Requirement**: Clerk Dashboard → Sessions → Customize session token must embed:
```json
{ "metadata": "{{user.public_metadata}}" }
```

Usage in API routes:
```ts
const denied = await assertAdmin()
if (denied) return denied
```

### `assertLeagueRole(leagueId, userId, allowed[])`

Checks the caller's `LeagueMemberRole` in the DB for the given league.

```ts
const denied = await assertLeagueRole(id, userId, [
  LeagueMemberRole.COMMISSIONER,
  LeagueMemberRole.CO_COMMISSIONER,
])
if (denied) return denied
```

### `getLeagueRole(leagueId, userId)`

Returns the `LeagueMemberRole` for a user in a league, or `null` if not a member.

### `requireAdmin()`

Page-level guard — calls `redirect("/")` if unauthenticated or not admin. Use in Server Components / page files.

### `isAdminFromClaims()`

Returns `true`/`false` without throwing. Useful for conditional rendering in server components.

---

## Multi-Tenancy (Org Scoping)

Every league maps 1:1 to a **Clerk Organization** (`clerkOrgId`).

- `auth.protect()` returns `{ userId, orgId }` — `orgId` is the active org in the Clerk session.
- League queries are scoped by `userId` (via `LeagueMember`) or `orgId` (for creation).
- Team queries are scoped by `leagueId`, which is in turn scoped by membership.

---

## Auth Levels Summary

| Level | Mechanism | Who |
|---|---|---|
| Unauthenticated | `isPublicRoute` bypass | Public (landing, sign-in, webhooks) |
| Authenticated | `auth.protect()` | Any signed-in Clerk user |
| League member | `assertLeagueRole(...)` | Members of the specific league |
| Admin | `assertAdmin()` | Users with `publicMetadata.role = "admin"` |
