import {
  PRIMITIVE_TYPES,
  type PrimitiveType,
} from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import type { NodeTemplate } from "@/features/editor/domains/node-template";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと追加できます";

/**
 * ピル 1 つ分のボタン（UI 案 docs/Design Composer.html の `36×32` / `border-radius:6px`）。
 *
 * アイコンだけのボタンなので、読み上げ名は `aria-label` で与える
 * （`TypeGlyph` は `aria-hidden` で、名前を持たない）。
 */
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
 * キャンバスに浮かぶツールバー（UI 案 docs/Design Composer.html。Design notes の
 * 「the canvas carries a floating toolbar instead of a status bar」/ #112）。
 *
 * 出すのはプリミティブの挿入だけ。UI 案はこの帯にポインタ（選択ツール）・`#`（artboard）・
 * `◆`（部品インスタンス）も並べているが、置いていない。ツールモードの概念が無く、
 * artboard の追加は未実装（#43）で、`◆` は Assets のドラッグ中に背景が付く状態表示で
 * ボタンですらないため。押しても何も起きないボタンを先に置くと、できない操作が画面に
 * ある状態になる（`ArtboardList` が UI 案の `+` を出していないのと同じ判断）。
 *
 * ボタンの並びは `PRIMITIVE_TYPES` から作る。プリミティブが増えたときに画面側の一覧が
 * 取り残されないようにするため（スキーマと二重管理しない）。
 *
 * 浮かせる位置指定をここが持つのは、浮いていること自体がこの部品の形だから
 * （UI 案の器が `position:absolute; bottom:16px; left:50%` を持っている）。
 * 位置指定された祖先の中に置く必要があり、置き場は `EditorLayout.CenterPane`。
 * **この位置指定を落としたことはテストでは落ちない**（happy-dom は Tailwind を
 * 解決しない）。気づく手段は Storybook の視覚差分だけなので、触るときは VRT を見ること。
 *
 * 影は Tailwind の階調に無い値なので UI 案の実測値をそのまま書いている。
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
