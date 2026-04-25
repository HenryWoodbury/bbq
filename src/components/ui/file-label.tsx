"use client"

import type { ChangeEventHandler, ReactNode, Ref } from "react"
import { useImperativeHandle, useRef } from "react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileLabelProps {
  size?: "sm" | "md" | "lg"
  accept?: string
  multiple?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLInputElement>
}

function FileLabel({
  size = "md",
  accept,
  multiple,
  onChange,
  children,
  className,
  ref,
}: FileLabelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant: "secondary", size }),
        "w-fit",
        className,
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={onChange}
      />
      {children}
    </button>
  )
}

export { FileLabel }
