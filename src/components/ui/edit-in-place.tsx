"use client"

import { CheckIcon, PencilIcon, XIcon } from "@/components/icons/lucide"
import { useImperativeHandle, useState } from "react"
import type { Ref } from "react"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/ui/icon-button"

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

export function EditInPlace({ value, onChange, maxLength, className, ref }: EditInPlaceProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useImperativeHandle(ref, () => ({
    getCurrentValue: () => (editing ? draft : value),
    commit: () => { if (editing) accept() },
  }))

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
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            className={cn("absolute inset-0 w-full bg-transparent outline-none p-0", className)}
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
    <span
      className="inline-flex items-center gap-1.5 cursor-pointer group"
      onClick={startEdit}
    >
      <span className={cn("inline-block group-hover:[box-shadow:0_2px_0_currentColor]", className)}>
        {value}
      </span>
      <PencilIcon className="size-[0.875em] shrink-0" />
    </span>
  )
}
