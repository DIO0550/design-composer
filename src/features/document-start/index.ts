/**
 * ファイルを開く / 作る導線と、まだ何も開いていないときの画面。
 *
 * ツールバーもここに置くのは、それが「開く / 新規作成」そのものの導線だから
 * （開いた後も出しっぱなしなのは、開き直す経路を残すため）。`DocumentSession` が
 * `opened` を持つのも、開く操作の結果が「開いている」だからで、開いた後の編集状態
 * （`EditorState`）はこの feature に無い。
 *
 * Why not: 開いているかどうかで画面を出し分ける `editor-screen` はここに置かない。
 * 2 つの feature が交わる切り替え点で、`app/` はロジックを持てない（rules/architecture.md）。
 */
export { DocumentStart } from "@/features/document-start/components/document-start";
export { DocumentToolbar } from "@/features/document-start/components/document-toolbar";
export { useDocumentSession } from "@/features/document-start/hooks/use-document-session";
