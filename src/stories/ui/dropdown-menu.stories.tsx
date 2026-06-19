import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuButton } from "@/components/ui/menu-button"

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [vsLhp, setVsLhp] = useState(true)
    const [vsRhp, setVsRhp] = useState(false)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MenuButton variant="secondary">Splits</MenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Projection splits</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={vsLhp} onCheckedChange={setVsLhp}>
            vs LHP
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={vsRhp} onCheckedChange={setVsRhp}>
            vs RHP
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Reset</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
