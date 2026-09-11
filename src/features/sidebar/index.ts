/**
 * 左ペイン一式（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html
 * の 56px のレールと 248px のパネル）。行き先を選ぶレール・見出し付きのパネルと、3 つの
 * 行き先（Layers / Assets / Tokens）の組み立てが属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**・**選ばれているトークンの対**・**凍結して
 * いるか**の 3 つだけ。`editor -> sidebar -> {tokens, assets}` の一方向にするため
 * `features/editor` は import せず、**書き込み（選択・並べ替え・部品化・トークンの選択
 * と追加・artboard の追加と並べ替え）もここに置かない**（受け取った受け口へ渡すだけ。編
 * 集の入口は `features/editor`）。
 *
 * 器（`EditorLayout.LeftPane`）を呼ばないのも 3 ペインの組み立ての一部だからで、「今どの行
 * き先か」の状態も両ペインを組む `opened-document-editor` が持つ（ここは語彙
 * `LeftPaneView` だけを公開する）。
 */
export { LeftPane } from "@/features/sidebar/components/left-pane";
export {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
