import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { UploadIcon } from "lucide-react"
import { FileLabel } from "@/components/ui/file-label"

const meta = {
  title: "UI/FileLabel",
  component: FileLabel,
  args: { size: "md", accept: ".csv", multiple: true },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof FileLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <FileLabel {...args}>
      <UploadIcon />
      Upload CSV
    </FileLabel>
  ),
}
