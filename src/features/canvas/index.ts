/**
 * キャンバスの直接操作一式（docs/06-ui.md「画面構成」の中央ペインと「キャンバス直接操作」
 * / UI 案 docs/Design Composer.html の中央の面）。artboard の並びを描く面（`ArtboardCanvas`）
 * と下端に浮くツールバー（`CanvasToolbar`）、ズーム / パン・範囲選択・移動 / 挿入のドラ
 * ッグ・リサイズ・Text のインライン編集が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**・**選ばれているトークンの対**・**凍結して
 * いるか**の 3 つだけ。`editor -> canvas` の一方向にするため `features/editor` は
 * import せず、**書き込みもここに置かない**（編集は undo / redo と自動保存に載る 1 つの
 * 経路に閉じており、入口は `features/editor`）。
 *
 * ズーム / パンとドラッグの状態も持たない。倍率の操作は上部バーにあり掴む場所はパレットに
 * もあるので、持ち主は両方の親（`opened-document-editor`）になり、ここはフックと表示の語彙
 * （`CanvasView`）を公開するだけ。
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
