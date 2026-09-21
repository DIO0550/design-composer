/**
 * 左ペインの部品のストーリー用の公開口。外の feature（`features/editor` の `left-pane`）
 * が、3 つの行き先を 1 つのドキュメントで揃えた絵を描くのに使う。
 *
 * 出すのは外から要るものだけに絞る（`rules/architecture.md`「モジュールの公開API」）。
 */
export { sampleRenameActions } from "@/features/sidebar/__stories__/sample-rename-actions";
export {
  SampleSidebarDocument,
  sampleSidebarSelection,
} from "@/features/sidebar/__stories__/sample-sidebar-document";
