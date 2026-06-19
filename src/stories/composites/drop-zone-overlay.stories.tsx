import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DropZoneOverlay } from "@/components/drop-zone-overlay"

const meta = {
  title: "Composites/DropZoneOverlay",
  component: DropZoneOverlay,
  args: { visible: true },
  argTypes: { visible: { control: "boolean" } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DropZoneOverlay>

export default meta
type Story = StoryObj<typeof meta>

// The overlay is fixed/inset-0; toggle `visible` in Controls to fade it in/out.
export const Playground: Story = {
  render: (args) => (
    <div className="relative h-[60vh] w-full bg-background">
      <p className="p-8 text-body text-muted-foreground">
        Drag-and-drop target. Toggle the <code>visible</code> control.
      </p>
      <DropZoneOverlay {...args} />
    </div>
  ),
}
