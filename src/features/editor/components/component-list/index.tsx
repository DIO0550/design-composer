import type { ComponentSet } from "@/domains/component";

/**
 * 部品一覧（docs/06-ui.md「画面構成」）。
 * 一覧からキャンバスへの挿入は「挿入」操作の Issue で実装する。
 */
export function ComponentList({
  components,
}: Readonly<{ components: ComponentSet }>) {
  const names = Object.keys(components);

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
            <li key={name} className="px-2 py-1">
              {name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
