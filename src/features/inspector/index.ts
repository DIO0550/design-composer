/**
 * 右ペイン一式（docs/06-ui.md「画面構成」の右ペイン / UI 案 docs/Design Composer.html
 * の 264px のインスペクタ）。選んでいるものの prop を編集する欄（`PropertyPanel`）が属
 * する。
 *
 * 描くのに要るのは**ドキュメントと選択の対**と**凍結しているか**の 2 つだけ。
 * `editor -> inspector` の一方向にするため `features/editor` は import せず、**書き込み
 * もここに置かない**（編集は undo / redo と自動保存に載る 1 つの経路に閉じており、入口
 * は `features/editor`）。
 *
 * ペインの殻（`EditorLayout.RightPane`）を呼ばないのは、3 ペインの組み立ての一部で
 * `features/editor` に属するため（`PropertyPanel` が返すのは帯の中身と本文だけで、実画
 * 面でどのペインへ着せるかは編集画面が決める）。feature 名と部品名で語彙を揃えないのは、
 * 右ペインが行き先によって中身が替わる**場所**で、`docs/06-ui.md` も「インスペクタ」と
 * 「プロパティパネル」を使い分けているため。
 */
export {
  PropertyPanel,
  ShorthandLabels,
} from "@/features/inspector/components/property-panel";
