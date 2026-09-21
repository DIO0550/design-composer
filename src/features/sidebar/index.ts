/**
 * 左ペイン一式（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html
 * の 56px のレールと 248px のパネル）。行き先を選ぶレールと見出し付きのパネルという器、
 * および行き先 `Layers` の中身（`LayersPanel`）が属する。
 *
 * **器は行き先ごとの中身を持たない。** 行き先ぶん揃った `LeftPaneViewContent` を受け取って
 * 出すだけで、`Layers` を含めてどれを差すかは両ペインを組む側（`opened-document-editor`）
 * が決める。おかげでここは他の feature を 1 つも import しない。
 *
 * **書き込み（選択・並べ替え・部品化・トークンの選択と追加・artboard の追加と並べ替え）も
 * ここに置かない**（受け取った受け口へ渡すだけ。編集の入口は `features/editor`）。
 *
 * 器（`EditorLayout.LeftPane`）を呼ばないのも 3 ペインの組み立ての一部だからで、「今どの行
 * き先か」の状態も `opened-document-editor` が持つ。
 */
export { LayersPanel } from "@/features/sidebar/components/layers-panel";
export { LeftPane } from "@/features/sidebar/components/left-pane";
export {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
export type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
