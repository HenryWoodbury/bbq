"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface FileLabelProps {
  accept?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  children?: React.ReactNode
  className?: string
}

const FileLabel = React.forwardRef<HTMLInputElement, FileLabelProps>(
  ({ accept, onChange, children, className }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "secondary", size: "md" }),
          className,
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onChange}
        />
        {children}
      </button>
    )
  },
)
FileLabel.displayName = "FileLabel"

export { FileLabel }
