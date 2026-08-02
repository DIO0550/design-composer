import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * ツリービュー（docs/06-ui.md「画面構成」）。
 * 今は木の根である artboard だけを並べる。子ノードを再帰的に辿る描画・
 * ドラッグによる並べ替えはツリービュー本体の Issue で実装する。
 */
export function DocumentTree({
  state,
  onSelect,
}: Readonly<{
  state: EditorState;
  onSelect: (name: string) => void;
}>) {
  const artboards = state.document.artboards;

  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        ツリー
      </h2>
      {artboards.length === 0 ? (
        <p className="text-gray-500">artboard がありません</p>
      ) : (
        <ul>
          {artboards.map((artboard) => (
            <li key={artboard.name}>
              <button
                type="button"
                aria-current={EditorState.isSelected(state, artboard.name)}
                onClick={() => onSelect(artboard.name)}
                className="w-full rounded px-2 py-1 text-left hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-900"
              >
                {artboard.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
