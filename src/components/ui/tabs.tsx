"use client"

import { Tabs as TabsPrimitive } from "radix-ui"
import { createContext, type ComponentProps, use } from "react"
import { cn } from "@/lib/utils"

type TabsSize = "sm" | "md" | "lg"

const TabsSizeContext = createContext<TabsSize>("md")

function Tabs({
  size = "md",
  ...props
}: ComponentProps<typeof TabsPrimitive.Root> & { size?: TabsSize }) {
  return (
    <TabsSizeContext value={size}>
      <TabsPrimitive.Root {...props} />
    </TabsSizeContext>
  )
}

function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  const size = use(TabsSizeContext)
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0.5 bg-subtle p-1",
        size === "sm" && "rounded-md",
        size === "md" && "rounded-lg",
        size === "lg" && "rounded-xl",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const size = use(TabsSizeContext)
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center border border-transparent font-medium text-body leading-[calc(4/3)] text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground disabled:opacity-disabled disabled:cursor-not-allowed",
        size === "sm" && "rounded-sm px-3 py-1",
        size === "md" && "rounded-md px-4 py-1.5",
        size === "lg" && "rounded-lg px-4 py-2",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-6 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
