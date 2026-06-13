"use client"

import { useState } from "react"
import { showToast, type ToastVariant } from "@/components/ui/sonner"

type Id = string | number

type OptimisticDeleteOptions<T, K extends Id> = {
  /** Stable id used to track the row while its deletion is pending. */
  getId: (item: T) => K
  /** Toast title shown while the delete is undoable. */
  title: string | ((item: T) => string)
  /**
   * Performs the actual deletion. Resolve `true` on success, or `false` to
   * restore the row (the hook un-hides it and shows `errorMessage`, if any).
   */
  perform: (item: T) => Promise<boolean>
  variant?: ToastVariant
  /** Runs once the delete succeeds, e.g. `router.refresh()`. */
  onSuccess?: (item: T) => void
  /** Error toast shown when `perform` resolves false. Omit for a silent restore. */
  errorMessage?: (item: T) => string
}

/**
 * Optimistic "delete with Restore" pattern. The row is hidden immediately and a
 * toast offers an Undo; the actual deletion (`perform`) only fires once the
 * toast is dismissed or auto-closes. The `cancelled`/`executed` guards cover the
 * Restore-vs-close and dismiss-vs-autoClose races. Hide pending rows by
 * filtering your data with the returned `pendingDeleteIds`.
 */
export function useOptimisticDelete<T, K extends Id = string>({
  getId,
  title,
  perform,
  variant,
  onSuccess,
  errorMessage,
}: OptimisticDeleteOptions<T, K>) {
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<K>>(new Set())

  function scheduleDelete(item: T) {
    const id = getId(item)
    setPendingDeleteIds((prev) => new Set(prev).add(id))
    let cancelled = false
    let executed = false

    function removePending() {
      setPendingDeleteIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }

    async function execute() {
      if (executed || cancelled) return
      executed = true
      const ok = await perform(item)
      if (ok) {
        onSuccess?.(item)
      } else {
        removePending()
        const message = errorMessage?.(item)
        if (message) showToast.error(message)
      }
    }

    showToast({
      title: typeof title === "function" ? title(item) : title,
      variant,
      action: {
        label: "Restore",
        onClick: () => {
          cancelled = true
          removePending()
        },
      },
      onDismiss: execute,
      onAutoClose: execute,
    })
  }

  return { pendingDeleteIds, scheduleDelete }
}
