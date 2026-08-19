"use client"

import type { Ref } from "react"
import { useEffect, useImperativeHandle, useState } from "react"
import { CheckIcon, PencilIcon, XIcon } from "@/components/icons/lucide"
import { IconButton } from "@/components/ui/icon-button"
import { cn } from "@/lib/utils"

export interface EditInPlaceHandle {
  getCurrentValue: () => string
  commit: () => void
}

interface EditInPlaceProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  className?: string
  ref?: Ref<EditInPlaceHandle>
}

export function EditInPlace({
  value,
  onChange,
  maxLength,
  className,
  ref,
}: EditInPlaceProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useImperativeHandle(ref, () => ({
    getCurrentValue: () => (editing ? draft : value),
    commit: () => {
      if (editing) accept()
    },
  }))

  useEffect(() => {
    if (!editing) return
    // Radix reads Escape from document capture; window capture runs first and claims it.
    function claimEscape(e: KeyboardEvent) {
      if (e.key === "Escape") e.preventDefault()
    }
    window.addEventListener("keydown", claimEscape, { capture: true })
    return () =>
      window.removeEventListener("keydown", claimEscape, { capture: true })
  }, [editing])

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function accept() {
    onChange(draft)
    setEditing(false)
  }

  function reset() {
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") accept()
    if (e.key === "Escape") reset()
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="relative inline-flex">
          <span
            aria-hidden
            className={cn("invisible whitespace-pre min-w-[8ch]", className)}
          >
            {draft}
          </span>
          <input
            // biome-ignore lint/a11y/noAutofocus: edit mode is user-initiated, focus must follow
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            className={cn(
              "absolute inset-0 w-full bg-transparent outline-none p-0",
              className,
            )}
            style={{ boxShadow: "0 2px 0 currentColor" }}
          />
        </span>
        <IconButton aria-label="Accept" onClick={accept}>
          <CheckIcon />
        </IconButton>
        <IconButton aria-label="Cancel" onClick={reset}>
          <XIcon />
        </IconButton>
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${value}`}
      className="inline-flex items-center gap-1.5 cursor-pointer group text-left"
      onClick={startEdit}
    >
      <span
        className={cn(
          "inline-block group-hover:[box-shadow:0_2px_0_currentColor]",
          className,
        )}
      >
        {value}
      </span>
      <PencilIcon className="size-[0.875em] shrink-0" />
    </button>
  )
}
