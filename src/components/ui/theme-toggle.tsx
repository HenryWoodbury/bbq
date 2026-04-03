"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { type Theme, useTheme } from "@/components/theme-provider"
import { IconButton } from "./icon-button"

const CYCLE: Theme[] = ["system", "light", "dark"]

const ICONS: Record<Theme, React.ReactNode> = {
  system: <MonitorIcon size={16} />,
  light: <SunIcon size={16} />,
  dark: <MoonIcon size={16} />,
}

const LABELS: Record<Theme, string> = {
  system: "System theme (click for light)",
  light: "Light theme (click for dark)",
  dark: "Dark theme (click for system)",
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]
    setTheme(next)
  }

  return (
    <IconButton
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      size="md"
    >
      {ICONS[theme]}
    </IconButton>
  )
}
