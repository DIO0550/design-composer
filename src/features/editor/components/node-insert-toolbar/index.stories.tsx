import type { Meta, StoryObj } from "@storybook/react-vite";
import { NodeInsertToolbar } from "./index";

const meta = {
  title: "features/editor/NodeInsertToolbar",
  component: NodeInsertToolbar,
  parameters: { layout: "fullscreen" },
  args: { onInsert: () => {} },
  decorators: [
    // 位置は下端に積む器（`CanvasDockStack`）が持つので、ここでも実画面と同じ
    // 下端中央へ置く。器を与えないと左上に貼り付き、実画面と違う姿で記録される。
    (Story) => (
      <div className="relative h-64 w-full bg-gray-100">
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <Story />
        </div>
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
