import { Component, ComponentSet } from "@/domains/component";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと挿入できます";

/**
 * 部品 1 件の行。名前は components の辞書キーが持つため、値と対で受け取る。
 * 公開 prop はインスタンスで上書きできる口なので、名前と並べて出す。
 */
function ComponentRow({
  name,
  component,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  name: string;
  component: Component;
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  const publicPropNames = Component.publicPropNames(component);

  return (
    <li className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-1">
          <span className="truncate">{name}</span>
          <span className="shrink-0 text-gray-500 text-xs">
            {component.type}
          </span>
        </span>
        {publicPropNames.length === 0 ? null : (
          <span className="text-gray-500 text-xs">
            {`公開 prop: ${publicPropNames.join(", ")}`}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={`${name} を挿入`}
        onClick={() => onInsert(name)}
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
 * 部品は選択の対象にしない。選択できるのはキャンバスに描かれるもの、つまり
 * artboard とその配下のノードだけ（`EditorState` と同じ線引き）。
 */
export function ComponentList({
  components,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  components: ComponentSet;
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  const names = ComponentSet.names(components);

  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        部品
      </h2>
      {names.length === 0 ? (
        <p className="text-gray-500">部品がありません</p>
      ) : (
        <ul>
          {names.map((name) => (
            <ComponentRow
              key={name}
              name={name}
              component={components[name]}
              isInsertEnabled={isInsertEnabled}
              onInsert={onInsert}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
