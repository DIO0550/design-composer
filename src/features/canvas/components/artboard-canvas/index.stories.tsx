import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { fn } from "storybook/test";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  EmptyCanvasDocument,
  SampleCanvasDocument,
  sampleCanvasSelection,
} from "@/features/canvas/__stories__/sample-canvas-document";
import { useCanvasView } from "@/features/canvas/hooks/use-canvas-view";
import { useNodeDrag } from "@/features/canvas/hooks/use-node-drag";
import { Option } from "@/utils/Option";
import { ArtboardCanvas } from "./index";

/**
 * 表示（倍率・位置）を自分で持つキャンバス。
 *
 * 本番は上部バーとドラッグの状態を編集画面と共有する（`OpenedDocumentEditor`）が、
 * キャンバス単体の見た目は共有相手に依らない。ストーリーの `component` を
 * こちらにしているのは、フックの戻り値は args として書けないため。
 *
 * Why not: 同じ形が `__tests__/setup.tsx` にもあるが、1 箇所へ寄せていない
 * （理由はそちらのコメント。`vitest` と Storybook のどちらかが相手のバンドルへ入る）。
 */
function CanvasWithView(
  props: Omit<ComponentProps<typeof ArtboardCanvas>, "canvasView" | "nodeDrag">,
) {
  const canvasView = useCanvasView();
  const nodeDrag = useNodeDrag({
    document: props.selection.document,
    view: canvasView.view,
    onMove: () => {},
    onInsertAt: () => {},
    onReposition: () => {},
  });
  return (
    <ArtboardCanvas {...props} canvasView={canvasView} nodeDrag={nodeDrag} />
  );
}

const meta = {
  title: "features/canvas/ArtboardCanvas",
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
    tokenSelection: TokenSelection.create(SampleCanvasDocument, Option.none),
    isFrozen: false,
    onSelect: fn(),
    onResize: fn(),
    onEditProp: fn(),
  },
} satisfies Meta<typeof CanvasWithView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { selection: sampleCanvasSelection() },
};

/** artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。 */
export const Selected: Story = {
  name: "artboard を選択中",
  args: { selection: sampleCanvasSelection(["settings"]) },
};

/**
 * 選択中のトークンを参照しているノードに破線が出る（#147）。
 *
 * `primary` を選ぶのは、キャンバス上でこれを指しているのが `overflow-wide` の 1 件だけで、
 * 破線が掛かる相手と掛からない相手の両方が 1 画面に出るため。
 *
 * **破線として描かれることと `outline-offset` はテストでは見えない**
 * （happy-dom は CSS を解決しない）。テストが押さえているのは「どの名前に規則が付くか」
 * までなので、見た目を確かめる手段はこのストーリーの視覚差分だけ。
 */
export const TokenSelected: Story = {
  name: "トークンを選択中",
  args: {
    selection: sampleCanvasSelection(),
    tokenSelection: TokenSelection.create(
      SampleCanvasDocument,
      Option.some({ kind: "colors", name: "primary" }),
    ),
  },
};

export const Empty: Story = {
  name: "artboard がない",
  args: {
    selection: DocumentSelection.fromNames(EmptyCanvasDocument, []),
    tokenSelection: TokenSelection.create(EmptyCanvasDocument, Option.none),
  },
};

/**
 * 外部編集でファイルが壊れているとき（#135）。最後に描けた内容が斜線のスクリムの下に
 * 残り、右上に「最後に正常だった表示」のバッジが出る。
 *
 * 選んだままの artboard に選択の枠は残るが、掴める帯（リサイズハンドル）は出ない。
 * 帯を出さないのは `inert` の効果ではなく、キャンバスが凍結中はハンドルを 1 本も
 * 渡さないため。**この差はこのストーリーにしか映らない**（凍結していない
 * `artboard を選択中` と見比べる）。
 */
export const Frozen: Story = {
  name: "ファイルが不正（凍結中）",
  args: { selection: sampleCanvasSelection(["home"]), isFrozen: true },
};
