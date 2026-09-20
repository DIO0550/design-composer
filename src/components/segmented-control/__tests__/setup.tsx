import { render } from "@testing-library/react";
import { vi } from "vitest";
import { SegmentedControl } from "../index";

/** ラベルとコントロールを結び付ける識別子。 */
const LabelId = "direction-label";

/** 器に並べる選択肢。 */
const Options = ["row", "column"] as const;

/**
 * ラベルは呼び出し側が持つものなので、器と一緒に描画する。
 *
 * @param selected 選ばれた状態で出す選択肢の綴り。どれも選ばれていないなら空
 * @param onSelect 選び直しの通知先。渡さなければ通知を捨てる
 */
export function renderControl(
  selected: readonly string[],
  onSelect: (option: string) => void = vi.fn(),
): void {
  render(
    <>
      <span id={LabelId}>Direction</span>
      <SegmentedControl labelledBy={LabelId}>
        {Options.map((option) => (
          <SegmentedControl.Segment
            key={option}
            isSelected={selected.includes(option)}
            onSelect={() => onSelect(option)}
          >
            {option}
          </SegmentedControl.Segment>
        ))}
      </SegmentedControl>
    </>,
  );
}
