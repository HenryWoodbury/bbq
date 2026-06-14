import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Button } from "./button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer"

const meta = {
  title: "UI/Drawer",
  component: Drawer,
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <Drawer open={open} onClose={() => setOpen(false)}>
        <DrawerTrigger asChild>
          <Button onClick={() => setOpen(true)}>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader onClose={() => setOpen(false)}>
            <DrawerTitle>Sync with Savant</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-body text-muted-foreground">
              Drawer body content. The scrim below the header uses the shared
              <code className="px-1">bg-overlay</code> token.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  },
}
