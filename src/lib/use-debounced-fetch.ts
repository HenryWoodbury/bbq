import { useEffect, useState } from "react"

/**
 * Fetches `url` after `delay` ms whenever `url` changes.
 * Pass `null` to clear results without fetching.
 */
export function useDebouncedFetch<T>(url: string | null, delay = 300) {
  const [data, setData] = useState<T[]>([])
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (url === null) {
      setData([])
      setPending(false)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      setPending(true)
      try {
        const res = await fetch(url)
        if (!cancelled) setData((await res.json()) as T[])
      } finally {
        if (!cancelled) setPending(false)
      }
    }, delay)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [url, delay])

  return { data, pending }
}
