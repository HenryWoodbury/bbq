import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useState } from "react"
import { MenuFilterGroup } from "@/components/ui/menu-filter-group"

const meta = {
  title: "UI/MenuFilterGroup",
  component: MenuFilterGroup,
} satisfies Meta

export default meta
type Story = StoryObj

const options = [
  { value: "system", icon: <MonitorIcon size={16} />, label: "System" },
  { value: "light", icon: <SunIcon size={16} />, label: "Light" },
  { value: "dark", icon: <MoonIcon size={16} />, label: "Dark" },
]

export const Theme: Story = {
  render: () => {
    const [value, setValue] = useState("system")
    return (
      <div className="w-48">
        <MenuFilterGroup
          label="Theme"
          options={options}
          value={value}
          onChange={setValue}
        />
      </div>
    )
  },
}
