import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible className="w-72">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          Advanced options
          <ChevronsUpDownIcon />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-md border border-border p-3 text-body text-muted-foreground">
        Hidden content revealed on toggle.
      </CollapsibleContent>
    </Collapsible>
  ),
}
