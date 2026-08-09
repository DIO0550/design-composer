import type { PrimitiveType } from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";

/**
 * パレットのプリミティブ（UI 案 docs/Design Composer.html の `Assets` > `Primitives`）。
 *
 * 行に操作は付けない。UI 案でのプリミティブの挿入はドラッグだけで、ドラッグは #129 の
 * スコープ外。ボタンを足すと挿入の入口が、キャンバスに浮かぶ `NodeInsertToolbar` と
 * 二重になる。
 *
 * 絞り込みはここでは行わない。何を出すかは検索欄を持つ `AssetsPanel` が決め、
 * ここは渡された並びを描くだけ（同じ絞り込みが 2 箇所に現れないようにする）。
 * 1 件も無いときも節は残す。`Components` 側と出方を揃えるためで、
 * 「一致するものが無い」は検索語を持つ `AssetsPanel` が 1 箇所で伝える。
 */
export function PrimitiveList({
  types,
}: Readonly<{ types: readonly PrimitiveType[] }>) {
  return (
    <section className="text-sm">
      <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        Primitives
      </h3>
      <ul>
        {types.map((type) => (
          <li
            key={type}
            className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100"
          >
            <TypeGlyph kind={type} />
            <span className="min-w-0 flex-1 truncate">{type}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
