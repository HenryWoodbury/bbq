# Tech Debt & Known Issues

Tracked concerns that are deferred to a future stage. Each entry includes the risk, affected file, and the stage at which it should be addressed.

---

## 🟡 `fetchCache` session staleness — `use-debounced-fetch.ts`

**File:** `src/lib/use-debounced-fetch.ts`  
**Target stage:** Alpha  
**Risk:** Medium — silent data correctness issue, difficult to debug

### Problem

`fetchCache` is a module-level `Map<string, Promise<unknown[]>>` that persists for the lifetime of the page. Once a URL is fetched, its result is cached indefinitely — no TTL, no cache busting, no invalidation on mutation.

**Concrete scenario:** An admin opens the "Add Player" modal and searches for a name. The results are cached. They add a player (mutating the database), then open the modal again and search the same name. The cached (pre-mutation) promise is returned — the newly added player may appear as addable again, or newly added teammates may be missing from results.

Cache issues are among the hardest bugs to reproduce and diagnose because they are session-state-dependent and leave no trace in logs.

### Fix Options (choose one at Alpha)

1. **Clear on mutation** — Export `clearFetchCache(url?: string)` and call it after any successful write (player add, edit, delete). Surgical and fast.

2. **Short TTL** — Wrap cached entries with a timestamp; re-fetch if older than N seconds (e.g. 30s). Balances freshness and network load.

3. **Version key in URL** — Append a `?v=<timestamp>` or `?v=<dataVersion>` to search URLs after mutations. Cache busts automatically; no changes to the cache internals.

4. **Remove the cache** — The debounce already limits request volume. The module-level cache was added for Suspense stability (same promise reference), but `useRef` inside the hook could hold the promise instead, scoping it to the component lifetime.

**Recommended:** Option 1 (clear on mutation) or Option 4 (ref-scoped promise). Option 1 is the smallest change; Option 4 eliminates the problem class entirely.
