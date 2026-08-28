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
  decorators: [
    (Story) => (
      /*
       * 3 ペインは高さを画面ではなく親に合わせる（`EditorLayout` の doc）ので、高さの決まった
       * 親が無いと中身の高さ（24px）まで潰れ、本物の画面と違うものが映る（#344）。
       * Why not: 本体（`EditorScreen`）が上に置くファイル操作のツールバーは写さない。
       * 写すと、器のストーリーがその帯を触っただけで動く。
       */
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
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
