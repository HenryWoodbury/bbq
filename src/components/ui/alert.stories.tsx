import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Alert } from "./alert"

const meta = {
  title: "UI/Alert",
  component: Alert,
  args: { children: "Something happened.", variant: "info", size: "md" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["success", "error", "warning", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Alert variant="success">Stats uploaded successfully.</Alert>
      <Alert variant="error">Upload failed — invalid CSV.</Alert>
      <Alert variant="warning">Some rows were skipped.</Alert>
      <Alert variant="info">Sync runs nightly at 3am.</Alert>
    </div>
  ),
}
