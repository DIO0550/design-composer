import type { ReactElement, ReactNode } from "react";

/**
 * 選択肢 1 つ分。
 *
 * @param isSelected この選択肢が今選ばれているか
 * @param onSelect この選択肢が押されたときに呼ぶ手続き
 * @returns 選択肢 1 つ分のボタン
 */
function Segment({
  isSelected,
  onSelect,
  children,
}: Readonly<{
  isSelected: boolean;
  onSelect: () => void;
  children: ReactNode;
}>): ReactElement {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className="grow basis-0 rounded px-1 py-1 text-[11px] text-gray-500 aria-pressed:bg-white aria-pressed:font-medium aria-pressed:text-gray-900 aria-pressed:shadow-sm"
    >
      {children}
    </button>
  );
}

/**
 * 選択肢を横に並べる器。今の値と押し直しの解釈は呼び出し側が持つ。
 *
 * `role="radiogroup"` + `aria-checked` にはしない。その role は必ず 1 つ選ばれている
 * ことを約束するが、この器は未選択にも戻せる使われ方をする（`prop-field` の enum は
 * 押し直しで未設定へ戻る）。
 *
 * @param labelledBy この器が何を選ばせているかを読み上げるラベルの識別子
 * @returns 選択肢を横に並べた器
 */
function SegmentedControlRoot({
  labelledBy,
  children,
}: Readonly<{ labelledBy: string; children: ReactNode }>): ReactElement {
  return (
    <fieldset
      aria-labelledby={labelledBy}
      // 幅に収まらない選択肢を省略せず折り返す（省略するとホバーでしか綴りが読めない）
      className="flex w-full min-w-0 flex-wrap gap-0.5 rounded-md bg-gray-100 p-0.5"
    >
      {children}
    </fieldset>
  );
}

/** 択一の選択を横に並べるコントロール。並べる中身は呼び出し側が `SegmentedControl.Segment` で組む。 */
export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Segment,
});
