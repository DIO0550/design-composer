/**
 * キャンバスの直接操作一式（docs/06-ui.md「画面構成」の中央ペインと
 * 「キャンバス直接操作」/ UI 案 docs/Design Composer.html の中央の面）。
 * artboard の並びを描く面（`ArtboardCanvas`）と、その下端に浮く挿入のツールバー
 * （`NodeInsertToolbar`）、ズーム / パン・移動 / 挿入のドラッグ・リサイズ・Text の
 * インライン編集が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**（`DocumentSelection`）・**選ばれている
 * トークンの対**（`TokenSelection`）・**凍結しているか**の 3 つだけで、編集画面の状態
 * （`EditorState`）は受け取らない。`editor -> canvas` の一方向にするため、この feature
 * から `features/editor` は import しない（`canvas -> editor` の辺を作ると循環する）。
 *
 * 書き込み（選択・移動・挿入・大きさの変更・文言の確定）は受け取った受け口へ渡すだけで、
 * ここには置かない。編集は編集履歴（undo / redo）と自動保存に載る 1 つの経路に閉じており、
 * その入口は `features/editor` にあるため。
 *
 * Why not: ズーム / パンの状態（`useCanvasView`）はこの feature が持たない。倍率の操作は
 * 上部バー（`features/editor`）にあり、キャンバスと上部バーが同じ 1 つの表示を見る必要が
 * あるため、状態の持ち主は両方の親（`opened-document-editor`）に置き、ここはフックと
 * 表示の語彙（`CanvasView`）を公開するだけにする。
 *
 * Why not: ドラッグの状態（`useNodeDrag`）も同じ。掴む場所がキャンバスだけでなく
 * パレット（`features/assets`）にもあるので、持ち主は両方の親になる。
 *
 * Why not: `NodeDrag` / `DraggedNode` は公開しない。外から要るのは「今パレットから
 * 何を運んでいるか」だけなので、`NodeDragControl.carriedTemplate` で答える。
 */
export { ArtboardCanvas } from "@/features/canvas/components/artboard-canvas";
export { NodeInsertToolbar } from "@/features/canvas/components/node-insert-toolbar";
export { CanvasView } from "@/features/canvas/domains/canvas-view";
export {
  type CanvasViewControl,
  useCanvasView,
} from "@/features/canvas/hooks/use-canvas-view";
export {
  type NodeDragHandlers,
  useNodeDrag,
} from "@/features/canvas/hooks/use-node-drag";
