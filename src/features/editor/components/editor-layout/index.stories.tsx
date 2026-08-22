import type { Meta, StoryObj } from "@storybook/react-vite";
import type { NodeDragHandlers } from "@/features/canvas";
import { EditorLayout } from "./index";

/** 何も掴んでいない状態のポインタの受け口。器の見た目はドラッグに依らない。 */
const IdleDragHandlers: NodeDragHandlers = {
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerLeave: () => {},
};

const meta = {
  title: "features/editor/EditorLayout",
  component: EditorLayout,
  parameters: { layout: "fullscreen" },
  args: { dragHandlers: IdleDragHandlers },
} satisfies Meta<typeof EditorLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "3ペインに中身を差し込む",
  args: {
    children: (
      <>
        <EditorLayout.LeftPane isFrozen={false}>
          レール・パネル
        </EditorLayout.LeftPane>
        <EditorLayout.CenterPane>キャンバス</EditorLayout.CenterPane>
        <EditorLayout.RightPane isFrozen={false}>
          プロパティパネル
        </EditorLayout.RightPane>
      </>
    ),
  },
};

/**
 * ファイルが不正で表示を凍結した 3 ペイン（#135）。左右が淡色に落ちることを
 * ここで比べられる（凍結は左右のペインだけで、キャンバスは自前でスクリムを持つ）。
 */
export const Frozen: Story = {
  name: "凍結した3ペイン",
  args: {
    children: (
      <>
        <EditorLayout.LeftPane isFrozen>レール・パネル</EditorLayout.LeftPane>
        <EditorLayout.CenterPane>キャンバス</EditorLayout.CenterPane>
        <EditorLayout.RightPane isFrozen>
          プロパティパネル
        </EditorLayout.RightPane>
      </>
    ),
  },
};
