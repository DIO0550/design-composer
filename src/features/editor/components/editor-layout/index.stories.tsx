import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScreenHeightShell } from "@/components/__stories__/screen-height-shell";
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
  // 殻が無いと 3 ペインが中身の高さ（24px）まで潰れ、本物の画面と違うものが映る（#344）。
  decorators: [
    (Story) => (
      <ScreenHeightShell>
        <Story />
      </ScreenHeightShell>
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
 * ファイルが不正で表示を凍結した 3 ペイン（#135）。凍結が掛かるのは左右のペインだけで、
 * キャンバスは自前でスクリムを持つ。
 *
 * 淡色そのものはここでは比べられない。ペインの中身が白地の文字だけなので、
 * `FrozenPaneClass` を落としても視覚差分が閾値に届かない（実測 0.0004 / 閾値 0.002。#346）。
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
