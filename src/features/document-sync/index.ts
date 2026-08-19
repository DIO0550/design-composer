/**
 * 編集中のドキュメントとファイルを一致させ続ける一式
 * （docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」「競合の解決」）。
 *
 * 自動で書き出す（`useAutoSave`）・外から届いた変更を取り込む（`useDocumentReload`）・
 * 表示中の内容でファイルを潰す（`useFileRevert`）の 3 つと、そのどれが失敗しても同じ
 * 意味（画面とファイルがずれているかもしれない）を伝える一覧（`DocumentSyncFailureList`）が
 * ここに属する。
 *
 * `useElapsed` もここに置く。数え始める起点が「外部編集でファイルが不正になった時刻」
 * （`FileValidity.since`）で、数えているのは**今映っているものがファイルからどれだけ
 * 古いか**だから。追従が失敗している側の状態そのものなので、経過時間は一般の計時ではなく
 * この feature の関心事になる。
 *
 * Why not: 上部バー（`editor-top-bar`）はここに置かない。バーはズームも映すので、移すと
 * この feature から `editor` の domain（`canvas-view`）を import することになり、
 * 他 feature の domains への直接 import になる。`EditorState` を読む
 * `opened-document-editor` も同じ（`editor-state` への import が要る）。どちらも `editor`
 * に残し、両方を知ってよい組み立て点を `editor` 側に置いて一方向にする。
 */
export { DocumentSyncFailureList } from "@/features/document-sync/components/document-sync-failure-list";
export { useAutoSave } from "@/features/document-sync/hooks/use-auto-save";
export { useDocumentReload } from "@/features/document-sync/hooks/use-document-reload";
export { useElapsed } from "@/features/document-sync/hooks/use-elapsed";
export {
  type FileRevertControl,
  useFileRevert,
} from "@/features/document-sync/hooks/use-file-revert";
