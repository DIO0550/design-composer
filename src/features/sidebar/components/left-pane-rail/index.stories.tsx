import type { Meta, StoryObj } from "@storybook/react-vite";
import { LeftPaneRail, LeftPaneViews } from "./index";

const meta = {
  title: "features/sidebar/LeftPaneRail",
  component: LeftPaneRail,
  parameters: { layout: "padded" },
  args: { onSelect: () => {} },
  decorators: [
    (Story) => (
      <div className="flex h-80 border border-gray-300">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeftPaneRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Layers: Story = {
  name: "Layers を見ている",
  args: { current: LeftPaneViews.Layers },
};

export const Assets: Story = {
  name: "Assets を見ている",
  args: { current: LeftPaneViews.Assets },
};

export const Tokens: Story = {
  name: "Tokens を見ている",
  args: { current: LeftPaneViews.Tokens },
};
