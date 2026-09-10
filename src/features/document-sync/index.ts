/**
 * 編集中のドキュメントとファイルを一致させ続ける一式（docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」
 * 「競合の解決」）。
 *
 * 自動で書き出す（`useAutoSave`）・外から届いた変更を取り込む（`useDocumentReload`）・表示中の内容でファイルを潰す
 * （`useFileRevert`）の 3 つと、そのどれが失敗しても同じ意味を伝える一覧（`DocumentSyncFailureList`）が属する。
 *
 * `useElapsed` もここに置く。数え始める起点が「外部編集でファイルが不正になった時刻」（`FileValidity.since`）で、数えて
 * いるのが**今映っているものがファイルからどれだけ古いか**だから。
 *
 * 上部バー（`editor-top-bar`）をここに置かないのは、バーが映すのがファイルとのずれだけでなくズームや開いているファイル名
 * でもあり、移すとこの feature が編集画面の状態（`editor-state`）まで import することになるため。
 */
export { DocumentSyncFailureList } from "@/features/document-sync/components/document-sync-failure-list";
export { useAutoSave } from "@/features/document-sync/hooks/use-auto-save";
export { useDocumentReload } from "@/features/document-sync/hooks/use-document-reload";
export { useElapsed } from "@/features/document-sync/hooks/use-elapsed";
export {
  type FileRevertControl,
  useFileRevert,
} from "@/features/document-sync/hooks/use-file-revert";
