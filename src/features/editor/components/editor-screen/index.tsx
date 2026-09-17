import type { ReactElement } from "react";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import {
  DocumentOpenFailureBanner,
  DocumentSession,
  type DocumentSessionPorts,
  DocumentStart,
  DocumentTabBar,
  useDocumentSession,
} from "@/features/document-start";
import {
  DocumentErrorList,
  DocumentErrorOrigins,
} from "@/features/editor/components/document-error-list";
import { OpenedDocumentEditor } from "@/features/editor/components/opened-document-editor";
import {
  KeyShortcutScopeProvider,
  KeyShortcutScopes,
} from "@/hooks/use-key-shortcut";
import type { Clock } from "@/libs/clock";
import type { DocumentIpc } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

/**
 * 開いているドキュメントを重ねて出す。見えるのは今見ているものだけ。
 *
 * 見えていないものも**描いたまま残す**。外すと編集状態（選択・undo 履歴・ズーム）が消え、
 * `useAutoSave` の書き出し待ちと `useDocumentReload` の監視も cleanup で止まる。監視を
 * 止めると外部変更を取りこぼす理由は `useDocumentReload` の doc にある。
 *
 * 隠すのに `hidden` 属性を使うのは、Tailwind の preflight が
 * `[hidden] { display: none !important }` を当てるため。クラスで隠すと、中の要素が持つ
 * `display` に負ける組み合わせが作れる。
 *
 * @returns 開いている数だけの編集画面
 */
function OpenedDocumentEditors({
  opened,
  clock,
  ipc,
}: Readonly<{
  opened: OpenedDocuments;
  clock: Clock;
  ipc: DocumentIpc;
}>): ReactElement {
  const activePath = OpenedDocuments.activePath(opened);

  return (
    <div className="min-h-0 flex-1">
      {OpenedDocuments.documents(opened).map((document) => {
        const isActive = document.path === activePath;
        return (
          <div key={document.path} hidden={!isActive} className="h-full">
            {/*
                見えていない編集画面はショートカットを張らない。`document` に張るので
                見えているかは関係なく、外すと 1 回の押下が開いている数だけ実行される。

                `useSpaceHeld`（キャンバスのパンの構え）はここでは止めない。押下を実行
                するのではなく修飾の状態を持つだけなので、背面で立っても見え方は変わらない。
              */}
            <KeyShortcutScopeProvider
              scope={
                isActive
                  ? KeyShortcutScopes.Listening
                  : KeyShortcutScopes.Suspended
              }
            >
              <OpenedDocumentEditor clock={clock} ipc={ipc} opened={document} />
            </KeyShortcutScopeProvider>
          </div>
        );
      })}
    </div>
  );
}

/**
 * アプリの画面。1 つも開いていない間は開始画面を、開いていればタブ列と編集画面を出す
 * （docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。
 *
 * 実物の組み立ては `app/` が持つ（rules/architecture.md）。
 */
export function EditorScreen({
  clock,
  ports,
}: Readonly<{ clock: Clock; ports: DocumentSessionPorts }>) {
  const {
    session,
    recentPaths,
    recentFilesFailure,
    actions,
    tabActions,
    commandFailure,
  } = useDocumentSession(ports);
  const failure = DocumentSession.failure(session);

  if (!Option.isSome(session.documents)) {
    return (
      // 中身の高さを画面に収める器。開始画面は親の高さ（`h-full`）に合わせるので、
      // ここで高さを決める必要がある。
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <div className="min-h-0 flex-1">
          <DocumentStart
            attempt={session.attempt}
            actions={actions}
            recentPaths={recentPaths}
            recentFilesFailure={recentFilesFailure}
            commandFailure={commandFailure}
            renderErrors={(errors) => (
              // 解釈できずに開けなかったファイルなので、由来は unopened-file で固定になる
              // （飛び先のノードも書き戻す表示中の内容もまだ無い）。
              <DocumentErrorList
                errors={errors}
                origin={DocumentErrorOrigins.UnopenedFile}
              />
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <DocumentTabBar
        opened={session.documents.value}
        onSelect={tabActions.activate}
        onClose={tabActions.close}
      />
      {/*
        開けなかったことは、タブ列の下に帯で伝える（docs/06-ui.md）。開始画面へ戻して
        出すと、開いているドキュメントが画面から消える。タブ列より上に置かないのは、
        失敗のたびにタブの位置が動くため。
      */}
      {Option.isSome(failure) && (
        <DocumentOpenFailureBanner failure={failure.value} />
      )}
      <OpenedDocumentEditors
        opened={session.documents.value}
        clock={clock}
        ipc={ports.ipc}
      />
    </div>
  );
}
