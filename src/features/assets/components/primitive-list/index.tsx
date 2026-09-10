import type { PrimitiveType } from "@/domains/dcmp/primitive-schema";
import { AssetRow } from "@/features/assets/components/asset-row";
import type { AssetGrab } from "@/features/assets/types/AssetGrab";

/** 行の右端に出す、掴めることの知らせ（UI 案 docs/Design Composer.html の綴り）。 */
const GrabHint = "drag";

/**
 * パレットのプリミティブ（UI 案 docs/Design Composer.html の `Assets` > `Primitives`）。
 * 行は掴んでキャンバスへ落とす起点で、押しても何も挿さらない（#203）。
 *
 * 出どころの強調を出さないのは、出どころになれるのが選択中のインスタンスの元になってい
 * る**部品**だけで、プリミティブはインスタンスの元にならないため。
 *
 * 絞り込みは行わない（何を出すかは検索欄を持つ `AssetsPanel` が決める）。1 件も無いとき
 * も節は残し、「一致するものが無い」は `AssetsPanel` が 1 箇所で伝える。
 */
export function PrimitiveList({
  types,
  grab,
}: Readonly<{ types: readonly PrimitiveType[]; grab: AssetGrab }>) {
  return (
    <section className="text-sm">
      <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        Primitives
      </h3>
      <ul>
        {types.map((type) => (
          <AssetRow
            key={type}
            kind={type}
            name={<span className="block truncate">{type}</span>}
            template={{ kind: "primitive", type }}
            grab={grab}
            accent="none"
          >
            <span className="shrink-0 text-[#c4c4c4] text-xs">{GrabHint}</span>
          </AssetRow>
        ))}
      </ul>
    </section>
  );
}
