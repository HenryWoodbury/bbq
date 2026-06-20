"use client"

import type { ChangeEventHandler, ReactNode, Ref } from "react"
import { useImperativeHandle, useRef } from "react"
import { UploadIcon } from "@/components/icons/lucide"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileLabelProps {
  size?: "sm" | "md" | "lg"
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLInputElement>
}

function FileLabel({
  size = "md",
  accept,
  multiple,
  disabled,
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
      disabled={disabled}
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
        disabled={disabled}
        className="sr-only"
        onChange={onChange}
      />
      <UploadIcon />
      {children}
    </button>
  )
}

export { FileLabel }
