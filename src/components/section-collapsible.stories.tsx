import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SectionCollapsible } from "./section-collapsible"

const meta = {
  title: "Composites/SectionCollapsible",
  component: SectionCollapsible,
  args: { title: "Park factors", size: "sm", defaultOpen: true },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta

export default meta
type Story = StoryObj

export const Playground: Story = {
  render: (args) => (
    <div className="w-96">
      <SectionCollapsible title="Park factors" {...args}>
        <p className="text-body text-muted-foreground">
          Collapsible section body content.
        </p>
      </SectionCollapsible>
    </div>
  ),
}
