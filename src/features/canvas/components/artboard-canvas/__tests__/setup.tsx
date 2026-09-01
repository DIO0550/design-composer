import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { PropEdit } from "@/domains/dcmp/node";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import type { Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import {
  canvasContent,
  renderedElement,
} from "@/features/canvas/__tests__/canvas-elements";
import { measuredAs } from "@/features/canvas/__tests__/canvas-measure";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { NodeResize } from "@/features/canvas/domains/node-resize";
import { useCanvasView } from "@/features/canvas/hooks/use-canvas-view";
import { useNodeDrag } from "@/features/canvas/hooks/use-node-drag";
import { Option } from "@/utils/Option";
import { ArtboardCanvas } from "../index";

/**
 * artboard の並びだけを差し替えたドキュメントと、選択の対
 * （トークンと部品は雛形をそのまま使う）。
 *
 * @param artboards 差し替える artboard の並び
 * @param selectedNames 選んでいるノードの名前。省略すると未選択
 * @returns その並びを持つドキュメントと選択の対
 */
export function selectionFromArtboards(
  artboards: Parameters<typeof DesignDocument.create>[0]["artboards"],
  selectedNames: readonly string[] = [],
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards,
    }),
    selectedNames,
  );
}

/**
 * キャンバスが描くのに要る値。トークンと凍結は見たいテストだけが渡せばよいので、
 * `renderCanvas` が既定（トークン未選択 / 凍結していない）を埋める。
 */
type CanvasValues = Readonly<{
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
}>;

/** キャンバスが外へ渡す操作。テストは見たいものだけを渡し、残りは呼ばれても何もしない。 */
type CanvasHandlers = Readonly<{
  onSelect: (names: readonly string[]) => void;
  onMoveNode: (name: string, to: ChildPosition) => void;
  onRepositionNode: (name: string, placement: AbsolutePlacement) => void;
  onRepositionArtboard: (name: string, canvasPosition: Offset) => void;
  onResize: (size: AxisLength) => void;
  onEditProp: (edit: PropEdit) => void;
}>;

/**
 * 表示（倍率・位置）とツリー内の移動 / 挿入のドラッグを自分で持つキャンバス。
 *
 * 本番はどちらも編集画面が持ち（`OpenedDocumentEditor`）、運んでいる間のポインタは
 * 3 ペインの器が受ける。掴む場所がパレット（左ペイン）にもあるためで、キャンバス単体の
 * 振る舞いはその共有相手に依らないので、ここでは器の役目まで自前で持たせる
 * （`canvasView` を自前で持つのと同じ扱い）。
 * **パレットから運ぶ経路はここでは通らない**ので、そちらは編集画面のテストが見る
 * （`opened-document-editor.asset-drag`）。器への配線が本番で外れていても、
 * そちらが落ちる。
 *
 * Why not: 同じ形が `index.stories.tsx` にもあるが、1 箇所へ寄せていない。
 * このファイルは `vitest` の `vi` を import しており、story から読むと Storybook の
 * バンドルへ `vitest` が入る。逆に story 側へ寄せるとテストが Storybook に依存する。
 */
function CanvasWithView(props: CanvasValues & CanvasHandlers) {
  const canvasView = useCanvasView();
  const nodeDrag = useNodeDrag({
    document: props.selection.document,
    view: canvasView.view,
    onMove: props.onMoveNode,
    onInsertAt: () => {},
    onReposition: props.onRepositionNode,
  });
  return (
    <div {...nodeDrag.dragHandlers}>
      <ArtboardCanvas {...props} canvasView={canvasView} nodeDrag={nodeDrag} />
    </div>
  );
}

/**
 * キャンバスを描く。
 *
 * @param props 描く値（`selection` は必須、トークンと凍結は既定あり）と、
 *   確かめたい操作だけのハンドラ
 * @returns `render` の戻り値
 */
export function renderCanvas(
  props: Readonly<{ selection: DocumentSelection }> &
    Partial<Omit<CanvasValues, "selection">> &
    Partial<CanvasHandlers>,
) {
  return render(
    <CanvasWithView
      tokenSelection={TokenSelection.create(
        props.selection.document,
        Option.none,
      )}
      isFrozen={false}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onRepositionNode={vi.fn()}
      onRepositionArtboard={vi.fn()}
      onResize={vi.fn()}
      onEditProp={vi.fn()}
      {...props}
    />,
  );
}

/**
 * キャンバスへ差し込まれた CSS 規則をすべて繋いだもの。
 *
 * 選択の枠は、キャンバスの中身が React の管理外にあるため `<style>` として
 * 差し込まれる（`NameStyleRule`）。出ているかどうかはここを読むしかない
 * （リサイズハンドルは実要素なので `resizeHandles` で引く）。
 */
export function injectedStyles(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("");
}

/**
 * 出ているリサイズハンドル。左上から時計回りの並び（`NodeResize.Placements`）。
 *
 * @returns 出ているハンドルの並び。出ていなければ空
 */
export function resizeHandles(): readonly HTMLElement[] {
  return screen.queryAllByTestId("resize-handle");
}

/**
 * その軸を掴めるハンドル。
 *
 * 並びの何番目かを数字で書かず `Placements` から引くのは、位置と軸の対応を
 * 決めているのがそちらだから（テスト側に写すと片方だけ変えられる）。
 *
 * @param axis 掴んだときに変わる軸
 * @returns その軸に対応する位置のハンドル。出ていなければテストを落とす
 */
export function resizeHandleFor(axis: Axis): HTMLElement {
  const index = NodeResize.Placements.findIndex(
    (placement) => placement.axis.some && placement.axis.value === axis,
  );
  return screen.getAllByTestId("resize-handle")[index];
}

/**
 * キャンバスに描かれている、名前で指した要素。
 *
 * @param name 描かれている artboard / ノードの名前
 * @returns その名前の要素。描かれていなければテストを落とす
 */
export function drawn(name: string): HTMLElement {
  return renderedElement(canvasContent(), name);
}

/**
 * 描かれた位置と大きさをテスト用の値にする。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、そのままでは
 * **どこが掴める帯か**（リサイズ）も**入力欄を重ねる位置**（インライン編集）も
 * 決まらない。差し替えるのはブラウザが行う測定だけで、その矩形から何が決まるかは
 * 実物のドメインが答える（リサイズなら `node-resize`、インライン編集なら `text-edit`。
 * どちらも `CanvasBounds.ofElement` 経由でここを読む）
 * （rules/testing.md「プロセス外・制御不能な境界」）。
 *
 * @param name 描かれているノードの名前
 * @param bounds そのノードが描かれていることにする位置と大きさ
 * @returns 測定を差し替えたあとの要素
 */
export function drawnAt(name: string, bounds: CanvasBounds): HTMLElement {
  const element = drawn(name);
  element.getBoundingClientRect = () =>
    new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
  return element;
}

/**
 * 描かれた内側の大きさをテスト用の値にする（差し替える理由は `measuredAs` の doc）。
 *
 * @param name 描かれている artboard / ノードの名前
 * @param size そのノードが描かれていることにする内側の大きさ
 */
export function drawnSized(
  name: string,
  size: Readonly<{ width: number; height: number }>,
): void {
  measuredAs(drawn(name), size);
}
