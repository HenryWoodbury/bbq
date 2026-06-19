import type { StorybookConfig } from "@storybook/nextjs-vite"

const config: StorybookConfig = {
  // Stories live in a dedicated tree under src/stories/, grouped by their title
  // taxonomy (foundations/ ui/ composites/ icons/) — not co-located with source.
  stories: ["../src/stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
}

export default config
