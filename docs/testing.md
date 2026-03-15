# Testing

## Stack

- **Framework**: Vitest 4 (Jest-compatible API, native ESM)
- **Config**: `vitest.config.ts` at project root
- **Environment**: `node` by default; add `// @vitest-environment jsdom` at the top of component test files
- **Setup file**: `src/test/setup.ts` — imports `@testing-library/jest-dom/vitest`

## Running Tests

```bash
pnpm test              # run all tests once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report (v8 provider)
```

Coverage is collected from `src/lib/**` and `src/app/api/**` (excludes `src/generated/**`).

---

## File Conventions

- Test files are co-located with source: `route.test.ts` next to `route.ts`
- No separate `__tests__` directories

---

## Prisma Mock Pattern

A deep mock of `PrismaClient` lives at `src/lib/__mocks__/prisma.ts`:

```ts
// src/lib/__mocks__/prisma.ts
import { mockDeep } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"

export const prisma = mockDeep<PrismaClient>()
```

Activate in any test file with:

```ts
vi.mock("@/lib/prisma")  // no factory — Vitest auto-uses __mocks__/prisma.ts
```

Then get the typed mock:

```ts
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})
```

---

## Clerk Mock Pattern

Clerk's `auth` export combines a callable function and a `.protect` method. Mock both with `vi.hoisted`:

```ts
const { mockAuthProtect } = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(vi.fn(), { protect: mockAuthProtect }),
}))
```

Then in tests:

```ts
mockAuthProtect.mockResolvedValue({ userId: "user_1", orgId: "org_1" })
```

---

## Example: API Route Test

```ts
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DeepMockProxy } from "vitest-mock-extended"
import { mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/generated/prisma/client"
import { LeagueMemberRole } from "@/generated/prisma/client"

const { mockAuthProtect } = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(vi.fn(), { protect: mockAuthProtect }),
}))
vi.mock("@/lib/prisma")

import { prisma } from "@/lib/prisma"
import { GET } from "./route"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

it("returns 200 with league data", async () => {
  mockAuthProtect.mockResolvedValue({ userId: "user_1" })
  prismaMock.league.findMany.mockResolvedValue([/* ... */])

  const req = new NextRequest("http://localhost/api/leagues")
  const res = await GET(req)
  expect(res.status).toBe(200)
})
```

---

## Test Count (as of dev stage)

30+ tests across auth-helpers, players route, leagues route, teams route — all passing.
