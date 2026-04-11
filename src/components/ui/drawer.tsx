"use client"

import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Root ─────────────────────────────────────────────────────────────────────

interface DrawerProps {
  open?: boolean
  onClose?: () => void
  children: ReactNode
}

function Drawer({ open, onClose, children }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose?.()}>
      {children}
    </DialogPrimitive.Root>
  )
}

// ── Trigger ───────────────────────────────────────────────────────────────────

const DrawerTrigger = DialogPrimitive.Trigger

// ── Overlay + Content ─────────────────────────────────────────────────────────

interface DrawerContentProps {
  side?: "left" | "right"
  width?: string
  children: ReactNode
  className?: string
}

function DrawerContent({
  side = "right",
  width = "w-150",
  children,
  className,
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-x-0 bottom-0 top-14 z-40 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed bottom-0 top-14 z-40 flex flex-col bg-card shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out duration-300",
          side === "right"
            ? "right-0 border-l border-border-zinc-200 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
            : "left-0 border-r border-border-zinc-200 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
          width,
          className,
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

function DrawerHeader({
  onClose,
  className,
  children,
  ...props
}: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border-zinc-200 py-3 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <DialogPrimitive.Close
          onClick={onClose}
          className="ml-2 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <XIcon size={24} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

// ── Title ─────────────────────────────────────────────────────────────────────

function DrawerTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-2xl font-semibold text-foreground", className)}
      {...props}
    />
  )
}

// ── Body ──────────────────────────────────────────────────────────────────────

function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto py-6 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 border-t border-border px-4 py-3", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
}
