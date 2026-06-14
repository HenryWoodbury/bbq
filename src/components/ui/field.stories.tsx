import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Field } from "./field"
import { Input } from "./input"

const meta = {
  title: "UI/Field",
  component: Field,
} satisfies Meta

export default meta
type Story = StoryObj

export const WithDescription: Story = {
  render: () => (
    <div className="w-72">
      <Field
        label="Player name"
        htmlFor="player"
        description="As it appears on the roster."
      >
        <Input id="player" placeholder="Shohei Ohtani" />
      </Field>
    </div>
  ),
}

export const WithError: Story = {
  render: () => (
    <div className="w-72">
      <Field label="Season" htmlFor="season" error="Season is required.">
        <Input id="season" placeholder="2026" />
      </Field>
    </div>
  ),
}
