import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta: Meta = {
  title: "Foundations/Typography",
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-8 text-foreground">
      <section className="flex flex-col gap-3">
        <h2>Headings (base layer)</h2>
        <h1>h1 — Baseball Queue (text-2xl / extrabold)</h1>
        <h2>h2 — Section heading (text-lg / bold)</h2>
        <h3>h3 — Subsection heading</h3>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Body text scale</h2>
        <p className="text-body">
          text-body — default paragraph copy (0.925rem)
        </p>
        <p className="text-sm">text-sm — secondary copy (0.825rem)</p>
        <p className="text-xs">text-xs — captions and metadata (0.725rem)</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2>Font families</h2>
        <p className="font-sans text-body">
          font-sans — Lato. The quick brown fox jumps over the lazy dog.
        </p>
        <p className="font-mono text-body">
          font-mono — Geist Mono. 0123456789 () =&gt; const x = 42
        </p>
        <div className="flex flex-wrap gap-4 font-sans">
          <span className="font-light">Lato 300</span>
          <span className="font-normal">Lato 400</span>
          <span className="font-bold">Lato 700</span>
          <span className="font-black">Lato 900</span>
        </div>
      </section>
    </div>
  ),
}
