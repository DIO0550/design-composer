/**
 * ファイルを開く / 作る導線と、それが決まるまでの画面。
 *
 * 開始画面（`DocumentStart`）はこの feature の一部で、全部ではない。ツールバーも
 * ここに置くのは、それが「開く / 新規作成」そのものの導線だから（開いた後も出しっぱなし
 * なのは、開き直す経路を残すため）。`DocumentSession` が `opened` を持つのも、開く操作の
 * 結果が「開いている」だからで、開いた後の編集状態（`EditorState`）はここに無い。
 *
 * Why not: 開いているかどうかで画面を出し分ける `editor-screen` はここに置かない。
 * 置くと `document-start` が編集画面を知ることになり、`editor` → `document-start` の
 * 一方向が壊れる（切り替え点は、両方を知ってよい側に置く）。
 */
export { DocumentStart } from "@/features/document-start/components/document-start";
export { DocumentToolbar } from "@/features/document-start/components/document-toolbar";
export { useDocumentSession } from "@/features/document-start/hooks/use-document-session";
