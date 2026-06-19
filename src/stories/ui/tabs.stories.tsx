import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const meta = {
  title: "UI/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="batters" className="w-96">
      <TabsList>
        <TabsTrigger value="batters">Batters</TabsTrigger>
        <TabsTrigger value="pitchers">Pitchers</TabsTrigger>
      </TabsList>
      <TabsContent value="batters">Batter projections go here.</TabsContent>
      <TabsContent value="pitchers">Pitcher projections go here.</TabsContent>
    </Tabs>
  ),
}
