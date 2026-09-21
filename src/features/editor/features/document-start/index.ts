/**
 * ファイルを開く / 作る導線と、どのドキュメントを見るかを決める導線。開始画面
 * （`DocumentStart`）はこの feature の一部で、全部ではない。
 *
 * 導線そのもの（どこから開く指示が来るか）もここに属する。開く / 作るの指示は OS のメ
 * ニューとウィンドウへのドロップから届き、画面には出ない（UI 案の帯は開く / 新規作成の
 * ボタンを持たないため）。開いているものを行き来する導線だけは画面に出る
 * （`DocumentTabBar`）。開いた後の編集状態（`EditorState`）はここに無い。
 */
export { DocumentOpenFailureBanner } from "@/features/editor/features/document-start/components/document-open-failure";
export { DocumentStart } from "@/features/editor/features/document-start/components/document-start";
export { DocumentTabBar } from "@/features/editor/features/document-start/components/document-tab-bar";
export { DocumentSession } from "@/features/editor/features/document-start/domains/document-session";
export {
  type DocumentSessionPorts,
  useDocumentSession,
} from "@/features/editor/features/document-start/hooks/use-document-session";
