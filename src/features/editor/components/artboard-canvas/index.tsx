import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * キャンバス（docs/06-ui.md「画面構成」）。
 * artboard を配列順に並べる枠だけを持つ。artboard の中身のレンダリング・
 * ズーム / パン・直接操作はキャンバス本体の Issue で実装する。
 */
export function ArtboardCanvas({
  state,
  onSelect,
}: Readonly<{
  state: EditorState;
  onSelect: (name: string) => void;
}>) {
  const artboards = state.document.artboards;

  if (artboards.length === 0) {
    return <p className="text-gray-500 text-sm">artboard がありません</p>;
  }

  return (
    <ul className="flex flex-wrap items-start gap-8">
      {artboards.map((artboard) => (
        <li key={artboard.name}>
          <button
            type="button"
            aria-current={EditorState.isSelected(state, artboard.name)}
            onClick={() => onSelect(artboard.name)}
            className="flex flex-col gap-1 rounded p-1 text-left aria-[current=true]:bg-blue-100"
          >
            <span className="text-gray-500 text-xs">{artboard.name}</span>
            <span
              // 大きさは artboard 自身が持つ値なので、Tailwind のクラスではなく style で渡す
              style={{ width: artboard.width, height: artboard.height }}
              className="block border border-gray-300 bg-white shadow-sm"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
