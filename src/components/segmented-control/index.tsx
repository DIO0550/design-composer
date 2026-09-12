import type { ReactElement } from "react";
import { Option } from "@/utils/Option";

/**
 * 選択肢を横に並べ、そのうち 1 つを選ばせるコントロール。選ばれているものをもう一度押す
 * と未選択（`none`）に戻る。
 *
 * @returns 選択肢ごとのトグルボタンを並べた器
 */
export function SegmentedControl({
  labelledBy,
  options,
  value,
  onChange,
}: Readonly<{
  labelledBy: string;
  options: readonly string[];
  value: Option<string>;
  onChange: (value: Option<string>) => void;
}>): ReactElement {
  return (
    <fieldset
      aria-labelledby={labelledBy}
      // 幅に収まらない選択肢を省略せず折り返す（省略するとホバーでしか綴りが読めない）
      className="flex w-full min-w-0 flex-wrap gap-0.5 rounded-md bg-gray-100 p-0.5"
    >
      {options.map((option) => {
        const isSelected = Option.contains(value, option);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() =>
              onChange(isSelected ? Option.none : Option.some(option))
            }
            className="grow basis-0 rounded px-1 py-1 text-[11px] text-gray-500 aria-pressed:bg-white aria-pressed:font-medium aria-pressed:text-gray-900 aria-pressed:shadow-sm"
          >
            {option}
          </button>
        );
      })}
    </fieldset>
  );
}
