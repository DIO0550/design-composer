import type { DocumentIpcError } from "@/libs/document-ipc";
import type { Option } from "@/utils/Option";

/**
 * 開いているファイルとの同期に失敗していることを伝える一覧
 * （docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」）。
 *
 * 自動保存と外部変更の監視をまとめて 1 つの一覧にするのは、どちらが失敗しても
 * 利用者に伝わる意味が同じ（画面の内容とファイルの中身がずれているかもしれない）だから。
 * 失敗が 1 つも無ければ何も描かず、キャンバスのレイアウトに影響させない。
 */
export function DocumentSyncFailureList({
  autoSave,
  watch,
}: Readonly<{
  autoSave: Option<DocumentIpcError>;
  watch: Option<DocumentIpcError>;
}>) {
  const autoSaveFailures = autoSave.some
    ? [{ label: "自動保存に失敗しました", error: autoSave.value }]
    : [];
  const watchFailures = watch.some
    ? [{ label: "外部変更の監視に失敗しました", error: watch.value }]
    : [];
  const failures = [...autoSaveFailures, ...watchFailures];

  if (failures.length === 0) {
    return null;
  }

  return (
    <section
      // 画面の内容がファイルと食い違っている可能性があることは、
      // 見えている表示だけでは分からないので支援技術にも伝える。
      role="alert"
      aria-label="ファイル同期の失敗"
      className="shrink-0 border-red-300 border-b bg-red-50 px-3 py-1 text-red-900 text-sm"
    >
      <ul className="flex flex-col gap-0.5">
        {failures.map((failure) => (
          // 同期の種類ごとに高々 1 件なので、ラベルがそのまま識別子になる。
          <li key={failure.label} className="flex gap-2">
            <span>{failure.label}</span>
            <span className="font-mono text-red-900/70 text-xs">
              {failure.error.message}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
