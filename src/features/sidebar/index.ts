/**
 * 左ペイン一式（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html
 * の 56px のレールと 248px のパネル）。行き先を選ぶレール・見出し付きのパネルと、3 つの
 * 行き先（Layers / Assets / Tokens）の組み立てが属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**・**選ばれているトークンの対**・**凍結して
 * いるか**の 3 つだけで、編集画面の状態（`EditorState`）は受け取らない。
 * `editor -> sidebar -> {tokens, assets}` の一方向にするため、ここから
 * `features/editor` は import しない。
 *
 * **書き込み（選択・並べ替え・部品化・トークンの選択と追加・artboard の追加と並べ替え）
 * はここに置かない。** 受け取った受け口へ渡すだけにするのは、編集が undo / redo と自動
 * 保存に載る 1 つの経路に閉じており、その入口が `features/editor` にあるため。
 *
 * パレット（`AssetsPanel` / `CreateComponent`）とトークン一覧（`TokenList`）をここへ移
 * さないのは、どちらも自分の feature に属していて、ここは行き先として**並べる**側だから。
 * 器（`EditorLayout.LeftPane`）を呼ばないのも、3 ペインの組み立ての一部で
 * `features/editor` に属するため（凍結の見出しだけを `isFrozen` で受け取る）。
 *
 * 「今どの行き先か」という状態も持たない。右ペインに何を出すかも同じ行き先で決まるので、
 * 持ち主は両ペインを組む `opened-document-editor` に置き、ここは行き先の語彙（`LeftPaneView`）
 * だけを公開する。
 */
export { LeftPane } from "@/features/sidebar/components/left-pane";
export {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
