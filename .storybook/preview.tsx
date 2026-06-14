import { withThemeByClassName } from "@storybook/addon-themes"
import type { Preview } from "@storybook/nextjs-vite"
import { withProviders } from "./decorators"
import "../src/app/globals.css"

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: "todo" },
    backgrounds: { disable: true },
  },
  decorators: [
    withProviders,
    // Toggles the `.dark` class on <html>, matching how ThemeProvider drives
    // the app. withProviders reads the resulting `globals.theme` for context.
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
}

export default preview
