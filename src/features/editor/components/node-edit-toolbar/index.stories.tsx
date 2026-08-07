import type { Meta, StoryObj } from "@storybook/react-vite";
import { NodeEditToolbar } from "./index";

/** 4 つの操作が揃ったツールバー。押せる状態だけをストーリーごとに変える。 */
function ToolbarWith({
  isInsertEnabled,
  isCopyEnabled,
  isPasteEnabled,
  isRemoveEnabled,
}: Readonly<{
  isInsertEnabled: boolean;
  isCopyEnabled: boolean;
  isPasteEnabled: boolean;
  isRemoveEnabled: boolean;
}>) {
  return (
    <NodeEditToolbar>
      <NodeEditToolbar.Insert isEnabled={isInsertEnabled} onInsert={() => {}} />
      <NodeEditToolbar.Copy isEnabled={isCopyEnabled} onCopy={() => {}} />
      <NodeEditToolbar.Paste isEnabled={isPasteEnabled} onPaste={() => {}} />
      <NodeEditToolbar.Remove isEnabled={isRemoveEnabled} onRemove={() => {}} />
    </NodeEditToolbar>
  );
}

const meta = {
  title: "features/editor/NodeEditToolbar",
  component: ToolbarWith,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolbarWith>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 子を持てるノード（artboard / Box）を選んでいて、まだ何もコピーしていない状態。 */
export const NodeSelected: Story = {
  name: "子を持てるノードを選んでいる",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: true,
    isPasteEnabled: false,
    isRemoveEnabled: true,
  },
};

/** コピー済みで、貼り付け先も決まっている状態。 */
export const NodeCopied: Story = {
  name: "コピー済みのノードがある",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: true,
    isPasteEnabled: true,
    isRemoveEnabled: true,
  },
};

/** artboard を選んでいる状態。artboard の削除・コピーは artboard 操作（#43）の担当。 */
export const ArtboardSelected: Story = {
  name: "artboard を選んでいる",
  args: {
    isInsertEnabled: true,
    isCopyEnabled: false,
    isPasteEnabled: false,
    isRemoveEnabled: false,
  },
};

/** 何も選んでいない状態。挿入先も削除の対象も決まらない。 */
export const NoSelection: Story = {
  name: "何も選んでいない",
  args: {
    isInsertEnabled: false,
    isCopyEnabled: false,
    isPasteEnabled: false,
    isRemoveEnabled: false,
  },
};
