import type { DocumentSyncFailure } from "@/domains/session/document-sync-failure";
import type { Option } from "@/utils/Option";

/**
 * 開いているファイルとの同期に失敗していることを伝える一覧
 * （docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」/ #136 の書き戻し）。
 *
 * 自動保存・外部変更の監視・ファイルへの書き戻しをまとめて 1 つの一覧にするのは、
 * どれが失敗しても利用者に伝わる意味が同じ（画面の内容とファイルの中身がずれているかも
 * しれない）だから。失敗が 1 つも無ければ何も描かず、キャンバスのレイアウトに影響させない。
 *
 * 並びは同期が起きる順（自動で書く → 外から届く → 明示的に書き戻す）に固定する。
 *
 * 名前が `DocumentSyncFailure` と同じ語幹なのは、まさにその失敗を並べる器だから。
 * ただし `DocumentSyncFailure[]` は受け取らない。どの同期で失敗したかはラベルに出す
 * 必要があり、失敗の値そのものはどれで起きたかを持たないため、経路ごとに受ける。
 */
export function DocumentSyncFailureList({
  autoSave,
  watch,
  revert,
}: Readonly<{
  autoSave: Option<DocumentSyncFailure>;
  watch: Option<DocumentSyncFailure>;
  revert: Option<DocumentSyncFailure>;
}>) {
  const syncKinds = [
    { label: "自動保存に失敗しました", failure: autoSave },
    { label: "外部変更の監視に失敗しました", failure: watch },
    { label: "ファイルへの書き戻しに失敗しました", failure: revert },
  ];
  const rows = syncKinds.flatMap(({ label, failure }) =>
    failure.some ? [{ label, failure: failure.value }] : [],
  );

  if (rows.length === 0) {
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
        {rows.map((row) => (
          // 同期の種類ごとに高々 1 件なので、ラベルがそのまま識別子になる。
          <li key={row.label} className="flex gap-2">
            <span>{row.label}</span>
            <span className="font-mono text-red-900/70 text-xs">
              {row.failure.message}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
