import { Component, ComponentSet } from "@/domains/component";

/**
 * 部品 1 件の行。名前は components の辞書キーが持つため、値と対で受け取る。
 * 公開 prop はインスタンスで上書きできる口なので、名前と並べて出す。
 */
function ComponentRow({
  name,
  component,
}: Readonly<{ name: string; component: Component }>) {
  const publicPropNames = Component.publicPropNames(component);

  return (
    <li className="flex flex-col gap-0.5 rounded px-2 py-1 hover:bg-gray-100">
      <span className="flex items-baseline gap-1">
        <span className="truncate">{name}</span>
        <span className="shrink-0 text-gray-500 text-xs">{component.type}</span>
      </span>
      {publicPropNames.length === 0 ? null : (
        <span className="text-gray-500 text-xs">
          {`公開 prop: ${publicPropNames.join(", ")}`}
        </span>
      )}
    </li>
  );
}

/**
 * 部品一覧（docs/06-ui.md「画面構成」）。
 * 一覧からキャンバスへの挿入は「挿入」操作の Issue（#39）で実装する。
 *
 * 部品は選択の対象にしない。選択できるのはキャンバスに描かれるもの、つまり
 * artboard とその配下のノードだけ（`EditorState` と同じ線引き）。
 */
export function ComponentList({
  components,
}: Readonly<{ components: ComponentSet }>) {
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
            <ComponentRow key={name} name={name} component={components[name]} />
          ))}
        </ul>
      )}
    </section>
  );
}
