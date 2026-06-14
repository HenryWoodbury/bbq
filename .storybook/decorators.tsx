import type { Decorator } from "@storybook/nextjs-vite"
import { Geist_Mono, Lato } from "next/font/google"
import {
  ThemeContext,
  type ThemeContextValue,
} from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

// Mirror src/app/layout.tsx so font-sans / font-mono resolve in stories.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "block",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "block",
})

/**
 * Supplies app context that components expect at runtime — without mounting the
 * real ThemeProvider, which would read localStorage and fight the toolbar's
 * theme toggle. isDark/accountIsDark are derived from the addon-themes global;
 * setTheme/setPreview are inert in Storybook.
 */
export const withProviders: Decorator = (Story, context) => {
  const isDark = context.globals.theme === "dark"
  const themeValue: ThemeContextValue = {
    theme: isDark ? "dark" : "light",
    setTheme: () => {},
    setPreview: () => {},
    isDark,
    accountIsDark: isDark,
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <TooltipProvider>
        <div className={`${lato.variable} ${geistMono.variable} font-sans`}>
          <Story />
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeContext.Provider>
  )
}
