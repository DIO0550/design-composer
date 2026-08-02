import type { EditorState } from "@/features/editor/domains/editor-state";

/**
 * プロパティパネル（docs/06-ui.md「画面構成」）。
 * 今は何が選択されているかだけを出す。スキーマからの入力欄の自動生成と
 * enabledWhen による出し分けはプロパティパネル本体の Issue で実装する。
 */
export function PropertyPanel({
  state,
  onClearSelection,
}: Readonly<{
  state: EditorState;
  onClearSelection: () => void;
}>) {
  const selectedName = state.selectedName;

  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        プロパティ
      </h2>
      {selectedName.some ? (
        <div className="flex flex-col items-start gap-2">
          <p>
            選択中: <span className="font-medium">{selectedName.value}</span>
          </p>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
          >
            選択を解除
          </button>
        </div>
      ) : (
        <p className="text-gray-500">選択されていません</p>
      )}
    </section>
  );
}
