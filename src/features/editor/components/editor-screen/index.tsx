import {
  type DocumentSessionPorts,
  DocumentStart,
  useDocumentSession,
} from "@/features/document-start";
import {
  DocumentErrorList,
  DocumentErrorOrigins,
} from "@/features/editor/components/document-error-list";
import { OpenedDocumentEditor } from "@/features/editor/components/opened-document-editor";
import type { Clock } from "@/libs/clock";

/**
 * 最近開いたファイル。保存先が決まるまでは常に空
 * （どこに残すかは #376 の担当で、この画面は受け取った一覧を並べるだけ）。
 */
const RecentPaths: readonly string[] = [];

/**
 * アプリの画面。開いているドキュメントが決まるまでは開始画面を、決まったら編集画面を出す
 * （docs/05-architecture.md「Tauri IPC」/ docs/06-ui.md「画面構成」）。
 *
 * 外部世界への口を props で受け取るのは、テストで代役に差し替えるため。
 * 実物の組み立ては `app/` が持つ（rules/architecture.md）。
 */
export function EditorScreen({
  clock,
  ports,
}: Readonly<{ clock: Clock; ports: DocumentSessionPorts }>) {
  const { session, actions, commandFailure } = useDocumentSession(ports);

  return (
    // 中身の高さを画面に収める器。帯が無くなっても、編集画面と開始画面はどちらも
    // 親の高さ（`h-full`）に合わせるので、ここで高さを決める必要がある。
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <div className="min-h-0 flex-1">
        {session.kind === "opened" ? (
          // 別のファイルを開いたら編集状態（選択・エラー）を作り直す。
          // key の差し替えで捨てるのは、Effect で state をリセットしないため（rules/hooks.md）。
          <OpenedDocumentEditor
            key={session.opened.path}
            clock={clock}
            ipc={ports.ipc}
            opened={session.opened}
          />
        ) : (
          // 解釈できずに開けなかったファイルなので、由来は unopened-file で固定になる
          // （飛び先のノードも書き戻す表示中の内容もまだ無い）。
          <DocumentStart
            session={session}
            actions={actions}
            recentPaths={RecentPaths}
            commandFailure={commandFailure}
            renderErrors={(errors) => (
              <DocumentErrorList
                errors={errors}
                origin={DocumentErrorOrigins.UnopenedFile}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
