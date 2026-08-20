/**
 * 挿せる部品のパレット一式（docs/06-ui.md「画面構成」の左ペインの `Assets` /
 * UI 案 docs/Design Composer.html の `Assets` 画面）。パネル本体（`AssetsPanel`）と、
 * パネル下端に固定する部品化のフッター（`CreateComponent`）が属する。どちらも
 * **表示中のドキュメントと選ばれている名前**（および掴む口）だけで描け、編集画面の
 * 状態（`EditorState`）は受け取らない。
 *
 * 掴む口（`AssetGrab`）はここが持つ。掴む側（この feature の各行）と落とす側
 * （`features/editor` のキャンバス）で対で意味を持つが、`Option<NodeTemplate>` を
 * 抱えるので `src/types/` には置けない（`rules/architecture.md`「依存方向のルール」
 * は types が domains を import することを禁じている）。掴む側の feature が持ち、
 * 落とす側は公開 API からの type import で受け取る。
 *
 * Why not: 部品化のロジック（`Componentization`）はここから export しない。使うのは
 * `CreateComponent` の内側だけで、features/editor 側の consumer が居ないため。
 */
export { AssetsPanel } from "@/features/assets/components/assets-panel";
export { CreateComponent } from "@/features/assets/components/create-component";
export type { AssetGrab } from "@/features/assets/types/AssetGrab";
