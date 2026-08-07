import type { Meta, StoryObj } from "@storybook/react-vite";
import { NodeEditToolbar } from "./index";

const meta = {
  title: "features/editor/NodeEditToolbar",
  component: NodeEditToolbar,
  parameters: { layout: "padded" },
  args: { onInsert: () => {}, onRemove: () => {} },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NodeEditToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 子を持てるノード（artboard / Box）を選んでいる状態。 */
export const NodeSelected: Story = {
  name: "子を持てるノードを選んでいる",
  args: { isInsertEnabled: true, isRemoveEnabled: true },
};

/** artboard を選んでいる状態。artboard の削除は artboard 操作（#43）の担当。 */
export const ArtboardSelected: Story = {
  name: "artboard を選んでいる",
  args: { isInsertEnabled: true, isRemoveEnabled: false },
};

/** 何も選んでいない状態。挿入先も削除の対象も決まらない。 */
export const NoSelection: Story = {
  name: "何も選んでいない",
  args: { isInsertEnabled: false, isRemoveEnabled: false },
};
