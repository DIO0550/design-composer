import type { Meta, StoryObj } from "@storybook/react-vite";
import { LEFT_PANE_VIEWS, LeftPaneRail } from "./index";

const meta = {
  title: "features/editor/LeftPaneRail",
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
  args: { current: LEFT_PANE_VIEWS.layers },
};

export const Assets: Story = {
  name: "Assets を見ている",
  args: { current: LEFT_PANE_VIEWS.assets },
};

export const Tokens: Story = {
  name: "Tokens を見ている",
  args: { current: LEFT_PANE_VIEWS.tokens },
};
