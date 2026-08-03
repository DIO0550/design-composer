import { DocumentStart } from "@/features/editor/components/document-start";
import { DocumentToolbar } from "@/features/editor/components/document-toolbar";
import { OpenedDocumentEditor } from "@/features/editor/components/opened-document-editor";
import { useDocumentSession } from "@/features/editor/hooks/use-document-session";
import type { DocumentDialog } from "@/libs/document-dialog";
import type { DocumentIpc } from "@/libs/document-ipc";

/**
 * アプリの画面。開いているドキュメントが決まるまでは開始画面を、決まったら編集画面を出す
 * （docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。
 *
 * ファイルへの口を props で受け取るのは、テストで代役に差し替えるため。
 * 実物の組み立ては `app/` が持つ（rules/architecture.md）。
 */
export function EditorScreen({
  ipc,
  dialog,
}: Readonly<{ ipc: DocumentIpc; dialog: DocumentDialog }>) {
  const { session, openDocument, createDocument } = useDocumentSession({
    ipc,
    dialog,
  });

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <DocumentToolbar
        session={session}
        onOpen={openDocument}
        onCreate={createDocument}
      />
      <div className="min-h-0 flex-1">
        {session.kind === "opened" ? (
          // 別のファイルを開いたら編集状態（選択・エラー）を作り直す。
          // key の差し替えで捨てるのは、Effect で state をリセットしないため（rules/hooks.md）。
          <OpenedDocumentEditor
            key={session.opened.path}
            ipc={ipc}
            opened={session.opened}
          />
        ) : (
          <DocumentStart session={session} />
        )}
      </div>
    </div>
  );
}
