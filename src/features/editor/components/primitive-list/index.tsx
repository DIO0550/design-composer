import type { PrimitiveType } from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { NodeTemplate } from "@/features/editor/domains/node-template";
import type { AssetGrab } from "@/features/editor/types/AssetGrab";

/** 行の右端に出す、掴めることの知らせ（UI 案 docs/Design Composer.html の綴り）。 */
const GrabHint = "drag";

/**
 * パレットのプリミティブ（UI 案 docs/Design Composer.html の `Assets` > `Primitives`）。
 *
 * 行は掴んでキャンバスへ落とす起点で、押しても何も挿さらない。UI 案の `Assets` は
 * browse-only で、挿入はドラッグだけが入口になっている（#203）。
 *
 * 絞り込みはここでは行わない。何を出すかは検索欄を持つ `AssetsPanel` が決め、
 * ここは渡された並びを描くだけ（同じ絞り込みが 2 箇所に現れないようにする）。
 * 1 件も無いときも節は残す。`Components` 側と出方を揃えるためで、
 * 「一致するものが無い」は検索語を持つ `AssetsPanel` が 1 箇所で伝える。
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
        {types.map((type) => {
          const template: NodeTemplate = { kind: "primitive", type };
          const isGrabbed =
            grab.dragged.some &&
            NodeTemplate.isSame(grab.dragged.value, template);

          return (
            <li
              key={type}
              /*
               * 掴んでいる行の色は UI 案の `Components` 側（`#e5f4ff` と左端の青い帯）に
               * 揃える。UI 案はプリミティブを掴んでいる画面を持たないが、同じパレットの
               * 行が種別ごとに違う掴まれ方をする理由が無い。
               *
               * 文字を選択させないのは、掴んで運ぶドラッグが範囲選択に化けるため
               * （キャンバスの artboard の枠と同じ理由）。掴んだまま画面を横断するので、
               * 選択の帯は左ペインだけでなく通り道の全体に残る。
               */
              className={`flex select-none items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100 ${
                isGrabbed ? "bg-[#e5f4ff] shadow-[inset_2px_0_0_#0d99ff]" : ""
              }`}
              onPointerDown={(event) => grab.onGrab(template, event)}
            >
              <TypeGlyph kind={type} />
              <span className="min-w-0 flex-1 truncate">{type}</span>
              <span className="shrink-0 text-[#c4c4c4] text-xs">
                {GrabHint}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
