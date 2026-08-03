import { DocumentSession } from "@/features/editor/domains/document-session";

/**
 * ファイルの導線（docs/05-architecture.md「ファイルを開くダイアログ等は Tauri 標準
 * プラグインを使用する」）。
 *
 * 開いている間も出しっぱなしにするのは、別のファイルを開く / 作り直すまでが
 * 1 つの流れだから（開始画面にだけ置くと、開いた後は開き直せなくなる）。
 */
export function DocumentToolbar({
  session,
  onOpen,
  onCreate,
}: Readonly<{
  session: DocumentSession;
  onOpen: () => void;
  onCreate: () => void;
}>) {
  // 処理中はボタン側で二重の開始を止める（ref のフラグで防がない / rules/hooks.md）。
  const isOpening = DocumentSession.isOpening(session);
  const openedPath = DocumentSession.openedPath(session);

  return (
    // 画面上部の帯（banner）そのものなので、ラベルは付けずに要素の意味へ任せる。
    <header className="flex shrink-0 items-center gap-2 border-gray-300 border-b bg-white px-3 py-2 text-gray-900 text-sm">
      <button
        type="button"
        onClick={onOpen}
        disabled={isOpening}
        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
      >
        開く
      </button>
      <button
        type="button"
        onClick={onCreate}
        disabled={isOpening}
        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
      >
        新規作成
      </button>
      {openedPath.some && (
        <span className="truncate font-mono text-gray-500 text-xs">
          {openedPath.value}
        </span>
      )}
    </header>
  );
}
