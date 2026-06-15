import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Alert } from "./alert"

const meta = {
  title: "UI/Alert",
  component: Alert,
  args: { children: "Something happened.", variant: "info", size: "md" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "error", "warning", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    clearable: { control: "boolean" },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Alert>No variant — neutral notice.</Alert>
      <Alert variant="success">Stats uploaded successfully.</Alert>
      <Alert variant="error">Upload failed — invalid CSV.</Alert>
      <Alert variant="warning">Some rows were skipped.</Alert>
      <Alert variant="info">Sync runs nightly at 3am.</Alert>
    </div>
  ),
}

// Pass `clearable` to add a far-right × that dismisses the alert (top-aligned
// with the variant icon). Optionally pass `onClear` to react to the dismissal.
export const Clearable: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Alert clearable>No variant — dismissible notice.</Alert>
      <Alert variant="success" clearable>
        Stats uploaded successfully.
      </Alert>
      <Alert variant="error" clearable>
        Upload failed — invalid CSV.
      </Alert>
      <Alert variant="info" clearable>
        Sync runs nightly at 3am. This one wraps onto a second line to show the
        × stays aligned with the icon at the top.
      </Alert>
    </div>
  ),
}

// Pass `icon={false}` to opt out of the variant icon.
export const NoIcon: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Alert variant="warning" icon={false}>
        Some rows were skipped.
      </Alert>
    </div>
  ),
}
