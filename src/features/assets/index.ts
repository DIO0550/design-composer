/**
 * 挿せる部品のパレット一式（docs/06-ui.md「画面構成」の左ペインの `Assets` / UI 案 docs/Design Composer.html の
 * `Assets` 画面）。パネル本体（`AssetsPanel`）と、パネル
 * 下端に固定する部品化のフッター（`CreateComponent`）が属する。
 *
 * どちらも**表示中のドキュメントと選ばれている名前**（および掴む口）だけで描け、編集画面の状態（`EditorState`）は
 * 受け取らない。
 *
 * 掴む口（`AssetGrab`）はここが持つ。掴む側と落とす側（`features/editor` のキャンバス）で対で意味を持つが、
 * `Option<NodeTemplate>` を抱えるので `src/types/` には置けない（types は domains を import できない）。
 *
 * 部品化のロジック（`Componentization`）を export しないのは、使うのが `CreateComponent` の内側だけで、これを並べる側に
 * consumer が居ないため。
 */
export { AssetsPanel } from "@/features/assets/components/assets-panel";
export { CreateComponent } from "@/features/assets/components/create-component";
export type { AssetGrab } from "@/features/assets/types/AssetGrab";
