/**
 * 左ペインの部品一式（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html
 * の 56px のレールと 248px のパネル）。行き先を選ぶレール・見出し付きのパネルの器と、
 * 行き先 `Layers` の中身が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**・**選ばれているトークンの対**・**凍結して
 * いるか**の 3 つだけで、**書き込み（選択・並べ替え・部品化・トークンの選択と追加・
 * artboard の追加と並べ替え）はここに置かない**（受け取った受け口へ渡すだけ。編集の入口は
 * `features/editor`）。
 *
 * **3 つの行き先を並べて左ペインに組むのは親の `features/editor` で、ここではない。**
 * `Assets` と `Tokens` の中身は兄弟の feature が持っており、兄弟を読めるのは親だけ。
 */
export { LayersPanel } from "@/features/sidebar/components/layers-panel";
export { LeftPanePanel } from "@/features/sidebar/components/left-pane-panel";
export {
  LeftPaneRail,
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
export type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
export type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
export type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
export type { LeftPaneTokenActions } from "@/features/sidebar/types/LeftPaneTokenActions";
