import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import {
  CheckIcon,
  CircleIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from "@/components/icons/lucide"
import { MenuFilterGroup } from "@/components/ui/menu-filter-group"

const meta = {
  title: "UI/MenuFilterGroup",
  component: MenuFilterGroup,
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const playgroundOptions = [
  { value: "a", icon: <CircleIcon size={16} />, label: "Option A" },
  { value: "b", icon: <CheckIcon size={16} />, label: "Option B" },
  { value: "c", icon: <PlusIcon size={16} />, label: "Option C" },
]

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState("a")
    return (
      <div className="w-48">
        <MenuFilterGroup
          {...args}
          label="Filter"
          options={playgroundOptions}
          value={value}
          onChange={setValue}
        />
      </div>
    )
  },
}

const themeOptions = [
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
          options={themeOptions}
          value={value}
          onChange={setValue}
        />
      </div>
    )
  },
}
