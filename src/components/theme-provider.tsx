"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "system" | "light" | "dark"

const STORAGE_KEY = "bbq-theme"

export type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  /** Temporary visual override (e.g. heat-map preview). Does not persist. Pass null to clear. */
  setPreview: (p: "light" | "dark" | null) => void
  /** Effective dark state — a preview wins over the persisted theme. */
  isDark: boolean
  /** Dark state resolved from the persisted theme alone, ignoring any preview. */
  accountIsDark: boolean
}

/** Exported for test/Storybook harnesses that supply a value without mounting the real provider. */
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [preview, setPreview] = useState<"light" | "dark" | null>(null)
  const [systemDark, setSystemDark] = useState(false)

  // Load the persisted theme and subscribe to OS changes (tracked even while a
  // preview is active, so accountIsDark stays correct underneath).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    setThemeState(stored ?? "system")
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(mq.matches)
    const handler = () => setSystemDark(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const accountIsDark =
    theme === "dark" ? true : theme === "light" ? false : systemDark
  const isDark = preview ? preview === "dark" : accountIsDark

  // Sync the actual <html> class to the effective dark state.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, setPreview, isDark, accountIsDark }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
