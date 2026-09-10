/**
 * キャンバスの直接操作一式（docs/06-ui.md「画面構成」の中央ペインと「キャンバス直接操作」/ UI 案 docs/Design Composer.html の中央の面）。artboard の並びを描く面
 * （`ArtboardCanvas`）と、その下端に浮くツールバー（`CanvasToolbar`）、ズーム / パン・範囲選択・移動 / 挿入のドラッグ・リサイズ・Text のインライン編集が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**・**選ばれているトークンの対**・**凍結しているか**の 3 つだけで、編集画面の状態（`EditorState`）は受け取らない。
 * `editor -> canvas` の一方向にするため、この feature から `features/editor` は import しない。
 *
 * **書き込み（選択・移動・挿入・大きさの変更・文言の確定）はここに置かない。** 編集が undo / redo と自動保存に載る 1 つの経路に閉じており、その入口が
 * `features/editor` にあるため。
 *
 * ズーム / パンの状態（`useCanvasView`）とドラッグの状態（`useNodeDrag`）もこの feature は持たない。倍率の操作は上部バーにあり、掴む場所はパレットにもあるので、持ち主は
 * 両方の親（`opened-document-editor`）になる。ここはフックと表示の語彙（`CanvasView`）を公開するだけにする。
 *
 * `NodeDrag` / `DraggedNode` を公開しないのは、外から要るのが「今パレットから何を運んでいるか」だけで、`NodeDragControl.carriedTemplate` が答えるため。
 */
export { ArtboardCanvas } from "@/features/canvas/components/artboard-canvas";
export { CanvasToolbar } from "@/features/canvas/components/canvas-toolbar";
export { CanvasView } from "@/features/canvas/domains/canvas-view";
export {
  type CanvasViewControl,
  useCanvasView,
} from "@/features/canvas/hooks/use-canvas-view";
export {
  type NodeDragHandlers,
  useNodeDrag,
} from "@/features/canvas/hooks/use-node-drag";
