import {
  PRIMITIVE_TYPES,
  type PrimitiveType,
} from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import type { NodeTemplate } from "@/features/editor/domains/node-template";

/** 押せないときに `title` へ出す理由。押せない状態を見せるだけだと打つ手が分からない。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと追加できます";

/** アイコンだけのボタン。`TypeGlyph` は `aria-hidden` なので、名前は `aria-label` で与える。 */
function InsertButton({
  type,
  isEnabled,
  onClick,
}: Readonly<{
  type: PrimitiveType;
  isEnabled: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={`${type} を追加`}
      onClick={onClick}
      disabled={!isEnabled}
      title={isEnabled ? undefined : INSERT_DISABLED_REASON}
      className="flex h-8 w-9 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <TypeGlyph kind={type} />
    </button>
  );
}

/**
 * キャンバスに浮かぶツールバー（UI 案 docs/Design Composer.html / #112）。
 *
 * UI 案が並べるポインタ・`#`（artboard）・`◆`（インスタンス）は置かない。順に
 * ツールモードの概念が無い / artboard の追加が未実装（#43）/ `◆` はドラッグ中の
 * 状態表示でボタンではない、が理由（`ArtboardList` が UI 案の `+` を出していないのと
 * 同じ判断）。並びを `PRIMITIVE_TYPES` から作るのは、スキーマと二重管理しないため。
 *
 * 位置指定と影はこの部品が持つ（浮いていること自体がこの部品の形）。ただし
 * **位置指定を落としてもテストは落ちない** — happy-dom は Tailwind を解決せず、
 * class 名の assert は実装詳細のテストになる。気づく手段は Storybook の視覚差分だけ。
 */
export function NodeInsertToolbar({
  isInsertEnabled,
  onInsert,
}: Readonly<{
  isInsertEnabled: boolean;
  onInsert: (template: NodeTemplate) => void;
}>) {
  return (
    <section
      aria-label="挿入"
      className="-translate-x-1/2 absolute bottom-4 left-1/2 flex h-11 items-center gap-0.5 rounded-[13px] bg-white px-1.5 shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
    >
      {PRIMITIVE_TYPES.map((type) => (
        <InsertButton
          key={type}
          type={type}
          isEnabled={isInsertEnabled}
          onClick={() => onInsert({ kind: "primitive", type })}
        />
      ))}
    </section>
  );
}
