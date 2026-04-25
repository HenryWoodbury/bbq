"use client"

import { useEffect, useRef, useState } from "react"

export function useFileDrop(
  onDrop: (files: File[]) => void,
  accept?: string,
): { isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false)
  const onDropRef = useRef(onDrop)
  useEffect(() => {
    onDropRef.current = onDrop
  })

  useEffect(() => {
    let depth = 0

    const acceptedExts = accept
      ? accept.split(",").map((s) => s.trim().toLowerCase())
      : null

    function hasFiles(e: DragEvent) {
      return e.dataTransfer?.types.includes("Files") ?? false
    }

    function filterAccepted(files: File[]) {
      if (!acceptedExts) return files
      return files.filter((f) =>
        acceptedExts.some((ext) => f.name.toLowerCase().endsWith(ext)),
      )
    }

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return
      e.preventDefault()
      if (++depth === 1) setIsDragging(true)
    }

    function onDragOver(e: DragEvent) {
      if (hasFiles(e)) e.preventDefault()
    }

    function onDragLeave() {
      if (--depth === 0) setIsDragging(false)
    }

    function onDropEvent(e: DragEvent) {
      e.preventDefault()
      depth = 0
      setIsDragging(false)
      const files = filterAccepted(Array.from(e.dataTransfer?.files ?? []))
      if (files.length > 0) onDropRef.current(files)
    }

    document.addEventListener("dragenter", onDragEnter)
    document.addEventListener("dragover", onDragOver)
    document.addEventListener("dragleave", onDragLeave)
    document.addEventListener("drop", onDropEvent)

    return () => {
      document.removeEventListener("dragenter", onDragEnter)
      document.removeEventListener("dragover", onDragOver)
      document.removeEventListener("dragleave", onDragLeave)
      document.removeEventListener("drop", onDropEvent)
    }
  }, [accept])

  return { isDragging }
}
