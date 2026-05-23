"use client"

import { cva, type VariantProps } from "class-variance-authority"
import type { CSSProperties, FocusEvent, InputHTMLAttributes } from "react"
import { useId } from "react"
import { cn } from "@/lib/utils"

export type FieldDef = {
  key: string
  label: string
  type?: InputHTMLAttributes<HTMLInputElement>["type"]
  min?: number
  max?: number
  step?: number
  width?: number
}

const groupVariants = cva(
  "overflow-hidden border border-border focus-within:ring-2 focus-within:ring-ring",
  {
    variants: {
      size: {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
)

const cellVariants = cva(
  "bg-transparent border-0 rounded-none text-body leading-[calc(4/3)] placeholder:text-muted-foreground focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800 disabled:opacity-disabled disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "px-2 min-h-8",
        md: "px-3 min-h-9",
        lg: "px-3 min-h-10",
      },
    },
    defaultVariants: { size: "md" },
  },
)

const labelVariants = cva("text-xs text-muted-foreground select-none", {
  variants: {
    size: {
      sm: "px-2",
      md: "px-3",
      lg: "px-3",
    },
  },
  defaultVariants: { size: "md" },
})

interface InputFieldGroupProps extends VariantProps<typeof groupVariants> {
  fields: FieldDef[]
  values: Record<string, number | string>
  onChange: (key: string, value: string) => void
  onBlur?: (key: string, e: FocusEvent<HTMLInputElement>) => void
  onFocus?: (key: string, e: FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  idPrefix?: string
  className?: string
}

function cellStyle(field: FieldDef): CSSProperties {
  return field.width ? { width: field.width, flex: "none" } : { flex: 1 }
}

function InputFieldGroup({
  fields,
  values,
  onChange,
  onBlur,
  onFocus,
  disabled,
  size = "md",
  idPrefix,
  className,
}: InputFieldGroupProps) {
  const generatedId = useId()
  const prefix = idPrefix ?? generatedId
  const allFixed = fields.every((f) => f.width)
  const rowDisplay = allFixed ? "inline-flex" : "flex"

  return (
    <div className={cn(rowDisplay, "flex-col gap-1", allFixed ? "self-start" : "w-full", className)}>
      <div className={rowDisplay}>
        {fields.map((field) => (
          <label
            key={field.key}
            htmlFor={`${prefix}-${field.key}`}
            className={labelVariants({ size })}
            style={cellStyle(field)}
          >
            {field.label}
          </label>
        ))}
      </div>

      <div className={cn(rowDisplay, groupVariants({ size }))}>
        {fields.map((field, i) => (
          <input
            key={field.key}
            id={`${prefix}-${field.key}`}
            type={field.type ?? "number"}
            min={field.min}
            max={field.max}
            step={field.step}
            value={values[field.key]}
            disabled={disabled}
            onChange={(e) => onChange(field.key, e.target.value)}
            onBlur={onBlur ? (e) => onBlur(field.key, e) : undefined}
            onFocus={onFocus ? (e) => onFocus(field.key, e) : undefined}
            className={cn(cellVariants({ size }), i > 0 && "border-l border-border")}
            style={cellStyle(field)}
          />
        ))}
      </div>
    </div>
  )
}

export { InputFieldGroup }
