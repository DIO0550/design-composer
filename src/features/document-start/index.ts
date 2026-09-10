/**
 * ファイルを開く / 作る導線と、それが決まるまでの画面。開始画面（`DocumentStart`）はこ
 * の feature の一部で、全部ではない。
 *
 * 導線そのもの（どこから開く指示が来るか）もここに属する。開いている間の指示は OS のメ
 * ニューとウィンドウへのドロップから届き、画面には出ない（#374。UI 案の帯は開く / 新規
 * 作成のボタンを持たないため）。開いた後の編集状態（`EditorState`）はここに無い。
 *
 * 開いているかどうかで画面を出し分ける `editor-screen` をここに置かないのは、置くと
 * `document-start` が編集画面を知ることになり、`editor` → `document-start` の一方向が壊
 * れるため。
 */
export { DocumentStart } from "@/features/document-start/components/document-start";
export {
  type DocumentSessionPorts,
  useDocumentSession,
} from "@/features/document-start/hooks/use-document-session";
