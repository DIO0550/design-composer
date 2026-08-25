/**
 * 左ペイン一式（docs/06-ui.md「画面構成」の左ペイン / UI 案 docs/Design Composer.html の
 * 56px のレールと 248px のパネル）。行き先を選ぶレール（`LeftPaneRail`）・見出し付きの
 * パネル（`LeftPanePanel`）と、3 つの行き先（Layers のツリーと artboard 一覧 / Assets の
 * パレット / Tokens の一覧）の組み立てが属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**（`DocumentSelection`）・**選ばれている
 * トークンの対**（`TokenSelection`）・**凍結しているか**の 3 つだけで、編集画面の状態
 * （`EditorState`）は受け取らない。`editor -> sidebar -> {tokens, assets}` の一方向に
 * するため、この feature から `features/editor` は import しない（`sidebar -> editor` の
 * 辺を作ると循環する）。
 *
 * 書き込み（選択・並べ替え・部品化・トークンの選択と追加・artboard の追加と並べ替え）は
 * 受け取った受け口へ渡すだけで、
 * ここには置かない。編集は編集履歴（undo / redo）と自動保存に載る 1 つの経路に閉じており、
 * その入口は `features/editor` にあるため。
 *
 * Why not: パレット（`AssetsPanel` / `CreateComponent`）とトークン一覧（`TokenList`）は
 * ここへ移さない。どちらも自分の feature に属していて、ここは行き先として**並べる**側。
 *
 * Why not: 器（`EditorLayout.LeftPane`）はここから呼ばない。3 ペインの組み立ての一部で
 * `features/editor` に属するため、淡色と `inert` は器の担当のまま（凍結の見出しだけを
 * `isFrozen` で受け取る）。
 *
 * Why not: 「今どの行き先か」という状態はこの feature が持たない。右ペインに何を出すかも
 * 同じ行き先で決まるので、状態の持ち主は両ペインを組む `opened-document-editor` に置き、
 * ここは行き先の語彙（`LeftPaneView`）だけを公開する。
 */
export { LeftPane } from "@/features/sidebar/components/left-pane";
export {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
