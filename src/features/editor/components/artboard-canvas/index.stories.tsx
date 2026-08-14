import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { fn } from "storybook/test";
import {
  EMPTY_EDITOR_STATE,
  SAMPLE_EDITOR_STATE,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
import { ArtboardCanvas } from "./index";

/**
 * 表示（倍率・位置）を自分で持つキャンバス。
 *
 * 本番は上部バーと 1 つの表示を共有する（`OpenedDocumentEditor`）が、キャンバス単体の
 * 見た目は共有相手に依らない。ストーリーの `component` をこちらにしているのは、
 * フックの戻り値は args として書けないため。
 *
 * Why not: 同じ形が `__tests__/setup.tsx` にもあるが、1 箇所へ寄せていない
 * （理由はそちらのコメント。`vitest` と Storybook のどちらかが相手のバンドルへ入る）。
 */
function CanvasWithView(
  props: Omit<ComponentProps<typeof ArtboardCanvas>, "canvasView">,
) {
  const canvasView = useCanvasView();
  return <ArtboardCanvas {...props} canvasView={canvasView} />;
}

const meta = {
  title: "features/editor/ArtboardCanvas",
  component: CanvasWithView,
  // キャンバスは中央ペインの高さいっぱいに広がるので、ペインと同じ高さの器に入れる
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen bg-gray-100">
        <Story />
      </div>
    ),
  ],
  args: {
    onSelect: fn(),
    onMoveNode: fn(),
    onResize: fn(),
    onEditProp: fn(),
  },
} satisfies Meta<typeof CanvasWithView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { state: SAMPLE_EDITOR_STATE },
};

/** artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。 */
export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "settings") },
};

/**
 * 選択中のトークンを参照しているノードに破線が出る（#147）。
 *
 * `primary` を選ぶのは、キャンバス上でこれを指しているのが `overflow-wide` の 1 件だけで、
 * 破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。
 *
 * **この破線はテストでは見えない**（happy-dom は CSS を解決しない）。
 * 目で確かめる手段はこのストーリーの視覚差分だけ。
 */
export const TokenSelected: Story = {
  name: "トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary",
    }),
  },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { state: EMPTY_EDITOR_STATE },
};
