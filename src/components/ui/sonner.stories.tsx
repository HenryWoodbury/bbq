import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "./button"
import { showToast } from "./sonner"

const meta = {
  title: "UI/Sonner (Toast)",
} satisfies Meta

export default meta
type Story = StoryObj

// The <Toaster /> is mounted by the Storybook providers decorator.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => showToast.success("Stats uploaded", "342 rows added.")}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => showToast.info("Sync scheduled", "Runs nightly at 3am.")}
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() => showToast.warning("Partial import", "12 rows skipped.")}
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => showToast.error("Upload failed", "Invalid CSV header.")}
      >
        Error
      </Button>
      <Button
        onClick={() =>
          showToast({
            title: "Delete heat map?",
            description: "This cannot be undone.",
            action: { label: "Undo", onClick: () => {} },
          })
        }
      >
        With action
      </Button>
    </div>
  ),
}
