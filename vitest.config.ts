import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig, type ViteUserConfig } from "vitest/config"

export default defineConfig({
  // Storybook pulls Vite 8 to the root while Vitest runs on its own bundled
  // Vite 7. Both work at runtime, but @vitejs/plugin-react is typed against the
  // root's Vite 8 Plugin, which doesn't structurally match Vitest's Vite 7
  // PluginOption. Bridge the type-only skew here.
  plugins: [react(), tsconfigPaths()] as unknown as ViteUserConfig["plugins"],
  test: {
    globals: true,
    environment: "node",
    // Per-file overrides: add `// @vitest-environment jsdom` to component test files
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["src/generated/**"],
    },
  },
})
