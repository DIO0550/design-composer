/**
 * 左ペインの器（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html
 * の 56px のレールと 248px のパネル）。行き先を選ぶレールと、見出し付きのパネルが属する。
 *
 * **行き先ごとの中身は持たない。** 何を出すかは組む側（`features/editor`）が
 * `LeftPaneViewContent` として差し込む。ここが中身を持つと、左ペインが他の子 feature を
 * 直接読むことになる（器と中身の結合をほどくため）。
 *
 * `LayersPanel` だけはここが実装を持つが、差し込む先を決めるのは組む側なので、他の行き先
 * と同じく公開して渡してもらう。
 *
 * 器（`EditorLayout.LeftPane`）を呼ばないのも 3 ペインの組み立ての一部だからで、「今どの行
 * き先か」の状態も両ペインを組む `opened-document-editor` が持つ。
 */
export { LayersPanel } from "@/features/sidebar/components/layers-panel";
export { LeftPane } from "@/features/sidebar/components/left-pane";
export {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
export type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
