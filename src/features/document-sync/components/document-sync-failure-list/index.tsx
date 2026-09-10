import type { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import type { Option } from "@/utils/Option";

/**
 * 開いているファイルとの同期に失敗していることを伝える一覧（docs/05-architecture.md「保存モデル: 自動保存」「外部編集の
 * 検知」/ #136 の書き戻し）。失敗が 1 つも無ければ何も描かない。
 *
 * 自動保存・外部変更の監視・書き戻しをまとめて 1 つの一覧にするのは、どれが失敗しても利用者に伝わる意味が同じ（画面の
 * 内容とファイルの中身がずれているかもしれない）だから。並びは同期が起きる順に固定する。
 *
 * **この一覧が出すのは経路のラベルと診断用の原文だけで、`reason` は読まない。** 開く経路（`ioFailureLabel`）のように
 * 理由ごとの日本語を出さないのは、同期の失敗が「何をしていて失敗したか」で伝わるため。
 *
 * `DocumentAccessFailure[]` を受け取らず経路ごとに受けるのは、失敗の値そのものがどれで起きたかを持たないため。
 */
export function DocumentSyncFailureList({
  autoSave,
  watch,
  revert,
}: Readonly<{
  autoSave: Option<DocumentAccessFailure>;
  watch: Option<DocumentAccessFailure>;
  revert: Option<DocumentAccessFailure>;
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
