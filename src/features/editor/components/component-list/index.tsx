import type { ComponentRefCount } from "@/domains/component";
import { TypeGlyph } from "@/features/editor/components/type-glyph";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと挿入できます";

/**
 * 部品 1 件の行。名前の左に部品を表すアイコン、右にドキュメント内での使用数を出す
 * （UI 案 docs/Design Composer.html の `◆ primary-button ×4`）。
 *
 * 挿入ボタンは UI 案に無いが残している。消すとインスタンスを作る手段が画面から
 * 無くなるため（キャンバスにもツリーにも代わりの入口が無い）。ツリーの並べ替えボタンと
 * 同じ扱いで、代わりの操作は別の単位で入れる（#112）。
 */
function ComponentRow({
  refCount,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  refCount: ComponentRefCount;
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  return (
    <li className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100">
      <TypeGlyph kind="component" />
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <span className="min-w-0 flex-1 truncate">{refCount.name}</span>
      <span className="shrink-0 text-gray-400 text-xs">{`×${refCount.count}`}</span>
      <button
        type="button"
        aria-label={`${refCount.name} を挿入`}
        onClick={() => onInsert(refCount.name)}
        disabled={!isInsertEnabled}
        title={isInsertEnabled ? undefined : INSERT_DISABLED_REASON}
        className="shrink-0 rounded border border-gray-300 px-1 text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-50"
      >
        挿入
      </button>
    </li>
  );
}

/**
 * 部品一覧（docs/06-ui.md「画面構成」）。
 * 各行から選択位置へインスタンス（参照ノード）を挿せる（docs/06-ui.md「編集操作の一覧」）。
 *
 * 見出しは UI 案の綴りに合わせて `Components`（`left-pane-tabs` と同じ扱い）。
 * 部品の数を併記するのは、使われ方が一覧の外からも読めるようにするため。
 *
 * 部品は選択の対象にしない。選択できるのはキャンバスに描かれるもの、つまり
 * artboard とその配下のノードだけ（`EditorState` と同じ線引き）。
 */
export function ComponentList({
  refCounts,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  refCounts: readonly ComponentRefCount[];
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        {`Components · ${refCounts.length}`}
      </h2>
      {refCounts.length === 0 ? (
        <p className="text-gray-500">部品がありません</p>
      ) : (
        <ul>
          {refCounts.map((refCount) => (
            <ComponentRow
              key={refCount.name}
              refCount={refCount}
              isInsertEnabled={isInsertEnabled}
              onInsert={onInsert}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
