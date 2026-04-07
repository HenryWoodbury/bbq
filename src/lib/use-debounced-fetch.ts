import { useEffect, useState, useTransition } from "react"

const fetchCache = new Map<string, Promise<unknown[]>>()

function fetchCached<T>(url: string): Promise<T[]> {
  if (!fetchCache.has(url)) {
    const p = fetch(url)
      .then((r) => r.json() as Promise<T[]>)
      .catch((err) => {
        fetchCache.delete(url)
        return Promise.reject(err)
      })
    fetchCache.set(url, p)
  }
  return fetchCache.get(url) as Promise<T[]>
}

const EMPTY: Promise<never[]> = Promise.resolve([])

/**
 * Returns a stable promise for `url` after `delay` ms.
 * Pass `null` to reset to an empty resolved promise immediately.
 * Callers read data via `use(promise)` in a child component wrapped in <Suspense>.
 */
export function useDebouncedFetch<T>(url: string | null, delay = 300): {
  promise: Promise<T[]>
  pending: boolean
} {
  const [deferredUrl, setDeferredUrl] = useState(url)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (url === null) {
      setDeferredUrl(null)
      return
    }
    const t = setTimeout(() => {
      startTransition(() => setDeferredUrl(url))
    }, delay)
    return () => clearTimeout(t)
  }, [url, delay])

  return {
    promise: deferredUrl !== null ? fetchCached<T>(deferredUrl) : EMPTY,
    pending: isPending,
  }
}
