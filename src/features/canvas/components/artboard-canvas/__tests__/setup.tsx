import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { PropEdit } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import type { Offset } from "@/domains/unit/offset";
import {
  canvasContent,
  renderedElement,
} from "@/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import { resizeAnchorIndexFor } from "@/features/canvas/__tests__/canvas-resize";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import type { ResizeGrip } from "@/features/canvas/domains/node-resize";
import { useCanvasView } from "@/features/canvas/hooks/use-canvas-view";
import { useNodeDrag } from "@/features/canvas/hooks/use-node-drag";
import { Option } from "@/utils/Option";
import { ArtboardCanvas } from "../index";
import { nameSelector } from "../name-style-rule";
import { repositionPreviewDeclarations } from "../reposition-preview-style";

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
  onSelectInRange: (names: readonly string[]) => void;
  onMoveNode: (name: string, to: ChildPosition) => void;
  onRepositionNode: (name: string, to: ChildPlacement) => void;
  onRepositionArtboard: (name: string, canvasPosition: Offset) => void;
  onResize: (sizes: readonly AxisLength[]) => void;
  onEditProp: (edit: PropEdit) => void;
}>;

/**
 * 表示（倍率・位置）とツリー内の移動 / 挿入のドラッグを自分で持つキャンバス。
 *
 * 本番はどちらも編集画面が持ち、運んでいる間のポインタは 3 ペインの器が受ける（掴む場所
 * がパレットにもあるため）。キャンバス単体の振る舞いはその共有相手に依らないので、ここ
 * では器の役目まで自前で持たせる。**パレットから運ぶ経路はここでは通らない**ので、そち
 * らは編集画面のテスト（`opened-document-editor.asset-drag`）が見る。
 *
 * 同じ形が `index.stories.tsx` にもあるが 1 箇所へ寄せていないのは、このファイルが
 * `vitest` の `vi` を import しており、story から読むと Storybook のバンドルへ `vitest`
 * が入るため。
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
      onSelectInRange={vi.fn()}
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
 * 出ているリサイズハンドル。左上から時計回りの並び（`NodeResize.HandleAnchors`）。
 *
 * @returns 出ているハンドルの並び。出ていなければ空
 */
export function resizeHandles(): readonly HTMLElement[] {
  return screen.queryAllByTestId("resize-handle");
}

/**
 * 出ている揃った辺のガイド線。
 *
 * @returns 出ている線の並び。出ていなければ空
 */
export function snapGuides(): readonly HTMLElement[] {
  return screen.queryAllByTestId("snap-guide");
}

/**
 * その種類を掴めるハンドル。
 *
 * 並びの何番目かを数字で書かず `HandleAnchors` から引くのは、箇所と掴めるものの
 * 対応を決めているのがそちらだから（テスト側に写すと片方だけ変えられる）。
 *
 * @param kind 掴める種類（`width` / `height` / `both`）
 * @returns その種類を掴める箇所のハンドル
 * @throws その種類を掴める箇所が `HandleAnchors` に無いとき。ハンドルが 1 つも
 *   出ていない場合は `getAllByTestId` がテストを落とす
 */
export function resizeHandleFor(kind: ResizeGrip["kind"]): HTMLElement {
  const index = resizeAnchorIndexFor(kind);
  if (index < 0) {
    throw new Error(`${kind} を掴める箇所が HandleAnchors にありません`);
  }
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
 * artboard の並び（`ul`）。キャンバスの中で、**名前を持たない場所**として使う。
 * ここへ運んで離すと、落とせる親が 1 つも見つからない状態になる。
 *
 * @returns artboard の並びの要素。描かれていなければテストを落とす
 */
export function artboardList(): Element {
  return Option.unwrap(
    Option.fromNullable(canvasContent().querySelector("ul")),
  );
}

/**
 * 描かれた位置と大きさをテスト用の値にする。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、そのままでは**どこが掴める帯
 * か**（リサイズ）も**入力欄を重ねる位置**（インライン編集）も**親どうしの左上のずれ**
 * （親の付け替え）も決まらない。差し替えるのはブラウザが行う測定だけで、その矩形から何
 * が決まるかは実物のドメインが答える（rules/testing.md「プロセス外・制御不能な境界」）。
 *
 * **2 つの親の矩形を差し替えていないテストでは、原点のずれが 0 になる。** 付け替えで座
 * 標が直ることを見たいテストは、必ず両方の親をここに通すこと。
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
 * ノードを掴んだまま、まだ離していない状態にする。
 * 離す前の見た目を見るので `releasePointer` は撃たない。
 *
 * @param name 掴むノードの名前
 * @param by 画面上で運ぶ量
 */
export function carryNode(name: string, by: Offset): void {
  pressPointer(drawn(name), { x: 100, y: 100 });
  movePointer(drawn(name), { x: 100 + by.x, y: 100 + by.y });
}

/**
 * ノードを掴んで運び、離すまで。
 * 移動量は縦横で違う値にすること（取り違えても落ちないため）。
 *
 * @param name 掴むノードの名前
 * @param by 画面上で運ぶ量
 */
export function dragNode(name: string, by: Offset): void {
  carryNode(name, by);
  releasePointer(drawn(name), { x: 100 + by.x, y: 100 + by.y });
}

/**
 * ノードを掴んで別の要素の上まで運び、そこで離す。
 *
 * 離すのを運んだ先の要素へ撃つのは、ブラウザで起きるのがそれだから
 * （運んでいるノードは当たり判定から外れる / `repositionPreviewDeclarations`）。
 *
 * @param name 掴むノードの名前
 * @param to 運んだ先の要素（この要素が落とし先の親を決める）
 * @param by 画面上で運ぶ量
 */
export function dragNodeOnto(name: string, to: Element, by: Offset): void {
  pressPointer(drawn(name), { x: 100, y: 100 });
  movePointer(to, { x: 100 + by.x, y: 100 + by.y });
  releasePointer(to, { x: 100 + by.x, y: 100 + by.y });
}

/**
 * 掴んだノードへ差し込まれる、ずらして見せる規則 1 本。
 *
 * 宣言だけでなく**選択子込み**で組むのは、付ける相手を取り違えても宣言だけの
 * 突き合わせでは落ちないため（規則が別のノードへ付くと付け替えが丸ごと壊れる）。
 *
 * @param name ずれて見えるはずのノードの名前
 * @param offset ドキュメント上の px で表した移動量
 * @returns そのノードへ差し込まれる規則 1 本
 */
export function previewRule(name: string, offset: Offset): string {
  return `${nameSelector(name)}{${repositionPreviewDeclarations(offset)}}`;
}
