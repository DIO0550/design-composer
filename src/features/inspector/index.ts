/**
 * 右ペイン一式（docs/06-ui.md「画面構成」の右ペイン / UI 案 docs/Design Composer.html の 264px のインスペクタ）。選んでいるものの prop を
 * 編集する欄（`PropertyPanel`）が属する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**と**凍結しているか**の 2 つだけで、編集画面の状態（`EditorState`）は受け取らない。
 * `editor -> inspector` の一方向にするため、この feature から `features/editor` は import しない。
 *
 * **書き込み（props 編集・選択の解除・インスタンスの解除とまとめて選択）はここに置かない。** 編集が undo / redo と自動保存に載る 1 つの
 * 経路に閉じており、その入口が `features/editor` にあるため。
 *
 * ペインの殻（`EditorLayout.RightPane`）をここから呼ばないのは、3 ペインの組み立ての一部で `features/editor` に属するため。`PropertyPanel`
 * が返すのは帯の中身と本文だけ（`features/tokens` と同じ形）。
 *
 * feature 名（`inspector`）と部品名（`PropertyPanel`）で語彙を揃えないのは、右ペインが行き先によって中身が替わる**場所**で、
 * `docs/06-ui.md` も「選択」では**インスペクタ**、「画面構成」では**プロパティパネル**と使い分けているため。
 */
export {
  PropertyPanel,
  ShorthandLabels,
} from "@/features/inspector/components/property-panel";
