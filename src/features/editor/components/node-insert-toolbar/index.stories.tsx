import type { Meta, StoryObj } from "@storybook/react-vite";
import { NodeInsertToolbar } from "./index";

const meta = {
  title: "features/editor/NodeInsertToolbar",
  component: NodeInsertToolbar,
  parameters: { layout: "fullscreen" },
  args: { onInsert: () => {} },
  decorators: [
    // 自分で浮くので、置き場はキャンバス相当（位置指定された灰色の面）にする。
    (Story) => (
      <div className="relative h-64 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NodeInsertToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 子を持てるもの（artboard / Box）を選んでいる状態。 */
export const InsertEnabled: Story = {
  name: "挿せる位置がある",
  args: { isInsertEnabled: true },
};

/** 何も選んでいない状態。挿入先が決まらないので押せない。 */
export const NoSelection: Story = {
  name: "何も選んでいない",
  args: { isInsertEnabled: false },
};
