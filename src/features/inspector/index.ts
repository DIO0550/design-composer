/**
 * 右ペイン一式（docs/06-ui.md「画面構成」の右ペイン / UI 案 docs/Design Composer.html の
 * 264px のインスペクタ）。選んでいるものの prop を編集する欄（`PropertyPanel`）が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**（`DocumentSelection`）と**凍結しているか**の
 * 2 つだけで、編集画面の状態（`EditorState`）は受け取らない。`editor -> inspector` の
 * 一方向にするため、この feature から `features/editor` は import しない
 * （`inspector -> editor` の辺を作ると循環する）。
 *
 * 書き込み（props 編集・選択の解除・インスタンスの解除とまとめて選択）は受け取った
 * 受け口へ渡すだけで、ここには置かない。編集は編集履歴（undo / redo）と自動保存に載る
 * 1 つの経路に閉じており、その入口は `features/editor` にあるため。
 *
 * Why not: 器（`EditorLayout.RightPane`）はここから呼ばない。3 ペインの組み立ての一部で
 * `features/editor` に属するため、`PropertyPanel` は帯の中身と本文を分けて返し、
 * 器に入れるのは呼び出し側に任せる（`features/tokens` と同じ形）。
 *
 * Why not: feature 名（`inspector`）と部品名（`PropertyPanel`）で語彙を揃えない。
 * 右ペインは行き先によって中身が替わる**場所**（Tokens を選べば `TokenEditor` が入る）で、
 * `docs/06-ui.md` も「選択」では**インスペクタ**、「画面構成」では**プロパティパネル**と
 * 使い分けている。場所と中身は別の概念なので、名前も分けたまま持つ。
 */
export {
  PropertyPanel,
  ShorthandLabels,
} from "@/features/inspector/components/property-panel";
