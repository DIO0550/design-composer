import { useEditor } from "@/features/editor/components/editor-provider";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import type { DocumentIpc, DocumentIpcError } from "@/libs/document-ipc";
import type { Option } from "@/utils/Option";

function SyncFailure({
  label,
  failure,
}: Readonly<{ label: string; failure: Option<DocumentIpcError> }>) {
  if (!failure.some) {
    return null;
  }
  return (
    <p>
      {label}
      <span className="ml-2 font-mono text-red-900/70 text-xs">
        {failure.value.message}
      </span>
    </p>
  );
}

/**
 * 開いているファイルとの同期（自動保存と外部変更の取り込み）を張り、その失敗を表示する
 * （docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」）。
 *
 * 2 つのフックをここでまとめて呼ぶのは、どちらも「開いているファイルと画面を
 * 一致させ続ける」ための同期であり、失敗したときに利用者が知りたいことも同じ
 * （画面とファイルがずれているかもしれない）だから。
 *
 * ペインの外に置いているのは、失敗が出ていない間は何も描かず、キャンバスの
 * レイアウトに影響させないため。
 */
export function DocumentSyncStatus({
  ipc,
  path,
}: Readonly<{ ipc: DocumentIpc; path: string }>) {
  const { state, dispatch } = useEditor();

  const saveFailure = useAutoSave({ ipc, path, document: state.document });
  const watchFailure = useDocumentReload({
    ipc,
    path,
    onReload: (reload) => dispatch({ type: "reload_document", reload }),
  });

  if (!saveFailure.some && !watchFailure.some) {
    return null;
  }

  return (
    <div
      // 画面の内容がファイルと食い違っている可能性があることは、
      // 見えている表示だけでは分からないので支援技術にも伝える。
      role="alert"
      aria-label="ファイル同期の失敗"
      className="shrink-0 border-red-300 border-b bg-red-50 px-3 py-1 text-red-900 text-sm"
    >
      <SyncFailure label="自動保存に失敗しました" failure={saveFailure} />
      <SyncFailure
        label="外部変更の監視に失敗しました"
        failure={watchFailure}
      />
    </div>
  );
}
