import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { fn } from "storybook/test";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  EmptyCanvasDocument,
  SampleCanvasDocument,
  sampleCanvasSelection,
} from "@/features/editor/features/canvas/__stories__/sample-canvas-document";
import { useCanvasView } from "@/features/editor/features/canvas/hooks/use-canvas-view";
import { useNodeDrag } from "@/features/editor/features/canvas/hooks/use-node-drag";
import { Option } from "@/utils/Option";
import { ArtboardCanvas } from "./index";

/**
 * 表示（倍率・位置）を自分で持つキャンバス。
 *
 * 本番は上部バーとドラッグの状態を編集画面と共有する（`OpenedDocumentEditor`）が、キャンバ
 * ス単体の見た目は共有相手に依らない。
 */
function CanvasWithView(
  props: Omit<ComponentProps<typeof ArtboardCanvas>, "canvasView" | "nodeDrag">,
) {
  const canvasView = useCanvasView();
  const nodeDrag = useNodeDrag({
    selection: props.selection,
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
  title: "features/editor/features/canvas/ArtboardCanvas",
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
    onSelectInRange: fn(),
    onResize: fn(),
    onEditProp: fn(),
    onRepositionArtboard: fn(),
    onOpenContextMenu: fn(),
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
 * 選択中のトークンを参照しているノードに破線が出る。
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

/** `settings` だけを非表示にしたサンプル。 */
const HiddenSettingsDocument = DesignDocument.create({
  tokens: SampleCanvasDocument.tokens,
  components: SampleCanvasDocument.components,
  artboards: SampleCanvasDocument.artboards.map((artboard) =>
    artboard.name === "settings"
      ? { ...artboard, props: { ...artboard.props, visibility: "hidden" } }
      : artboard,
  ),
});

/**
 * 非表示の artboard は、選んでいても枠・見出し・リサイズハンドルごと描かれない
 * （docs/06-ui.md「非表示の artboard」）。後ろの自動配置の artboard は隠す前と同じ位置に残る
 * （`選択なし` と見比べる）。
 */
export const HiddenArtboardSelected: Story = {
  name: "非表示の artboard を選択中",
  args: {
    selection: DocumentSelection.fromNames(HiddenSettingsDocument, [
      "settings",
    ]),
    tokenSelection: TokenSelection.create(HiddenSettingsDocument, Option.none),
  },
};

/** `home-banner`（高さが固定の Box）だけを非表示にしたサンプル。 */
const HiddenBannerDocument = DesignDocument.create({
  tokens: SampleCanvasDocument.tokens,
  components: SampleCanvasDocument.components,
  artboards: SampleCanvasDocument.artboards.map((artboard) => ({
    ...artboard,
    children: artboard.children.map((child) =>
      child.name === "home-banner" && Node.isPrimitive(child)
        ? { ...child, props: { ...child.props, visibility: "hidden" } }
        : child,
    ),
  })),
});

/**
 * 非表示のノードは、ツリーから選んでいても枠もリサイズハンドルも描かれない
 * （docs/06-ui.md「リサイズハンドル」）。
 */
export const HiddenNodeSelected: Story = {
  name: "非表示のノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(HiddenBannerDocument, [
      "home-banner",
    ]),
    tokenSelection: TokenSelection.create(HiddenBannerDocument, Option.none),
  },
};

/** 既定のままの円と、幅 ≠ 高さの楕円を 1 つずつ置いたサンプル。 */
const EllipseDocument = DesignDocument.create({
  tokens: SampleCanvasDocument.tokens,
  artboards: [
    {
      name: "shapes",
      width: 320,
      height: 200,
      props: {
        layout: "row",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "white",
      },
      children: [
        { name: "dot", type: "Ellipse" },
        {
          name: "oval",
          type: "Ellipse",
          props: { width: 140, height: 72, background: "brand" },
        },
      ],
    },
  ],
});

/**
 * Ellipse は `border-radius: 50%` で丸く描かれる（docs/03-schema.md「Ellipse 自体」）。
 * テストが守るのは宣言を出すところまでで、**それが実際に円として描かれることは見えない**
 * （happy-dom は CSS を描かない）。確かめる手段はこのストーリーの視覚差分だけ。
 */
export const EllipseSelected: Story = {
  name: "Ellipse を選択中",
  args: {
    selection: DocumentSelection.fromNames(EllipseDocument, ["oval"]),
    tokenSelection: TokenSelection.create(EllipseDocument, Option.none),
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
 * 外部編集でファイルが壊れているとき。最後に描けた内容が斜線のスクリムの下に残り、右上に「最
 * 後に正常だった表示」のバッジが出る。
 *
 * 選んだままの artboard に選択の枠は残るが、リサイズハンドルは出ない。**この差はこのストー
 * リーにしか映らない**（凍結していない `artboard を選択中` と見比べる）。
 */
export const Frozen: Story = {
  name: "ファイルが不正（凍結中）",
  args: { selection: sampleCanvasSelection(["home"]), isFrozen: true },
};
