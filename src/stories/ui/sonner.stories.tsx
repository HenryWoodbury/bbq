import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@/components/ui/button"
import { showToast, type ToastVariant } from "@/components/ui/sonner"

const meta = {
  title: "UI/Sonner (Toast)",
} satisfies Meta

export default meta
type Story = StoryObj

const VARIANTS: { variant: ToastVariant; label: string }[] = [
  { variant: "default", label: "Default" },
  { variant: "success", label: "Success" },
  { variant: "info", label: "Info" },
  { variant: "warning", label: "Warning" },
  { variant: "error", label: "Error" },
]

// The <Toaster /> is mounted by the Storybook providers decorator.
// These auto-close, so they show no × close button.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={() => showToast("Default toast")}>
        Default
      </Button>
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
    </div>
  ),
}

// Any variant can carry an action. Action toasts don't auto-close, so they get
// both the action button and a × close, top-aligned with the variant icon.
export const WithAction: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {VARIANTS.map(({ variant, label }) => (
        <Button
          key={variant}
          variant="secondary"
          onClick={() =>
            showToast({
              title: `${label} with action`,
              description: "Resolve it, or dismiss with ×.",
              variant,
              action: { label: "Undo", onClick: () => {} },
            })
          }
        >
          {label}
        </Button>
      ))}
    </div>
  ),
}

// `persistent` keeps a toast open with a manual × (no action needed).
export const Persistent: Story = {
  render: () => (
    <Button
      variant="secondary"
      onClick={() =>
        showToast({
          title: "Heads up",
          description: "Stays until you close it with ×.",
          variant: "info",
          persistent: true,
        })
      }
    >
      Persistent toast
    </Button>
  ),
}

// Args-driven story so the Controls panel is populated (imperative toasts have no
// rendered component for Storybook to infer controls from on their own).
interface ToastArgs {
  variant: ToastVariant
  title: string
  description: string
  withAction: boolean
  persistent: boolean
}

export const Playground: Story = {
  args: {
    variant: "success",
    title: "Stats uploaded",
    description: "342 rows added.",
    withAction: false,
    persistent: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "info", "warning", "error"],
    },
    title: { control: "text" },
    description: { control: "text" },
    withAction: { control: "boolean" },
    persistent: { control: "boolean" },
  },
  render: (args) => {
    const { variant, title, description, withAction, persistent } =
      args as ToastArgs
    return (
      <Button
        onClick={() =>
          showToast({
            title,
            description,
            variant,
            persistent,
            action: withAction
              ? { label: "Undo", onClick: () => {} }
              : undefined,
          })
        }
      >
        Show toast
      </Button>
    )
  },
}
