import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { Option } from "@/utils/Option";
import { SegmentedControl } from "../index";

/** ラベルとコントロールを結び付ける識別子。 */
const LABEL_ID = "direction-label";

/**
 * ラベルは呼び出し側が持つものなので、器と一緒に描画する。
 *
 * @param value 今選ばれている値
 * @param onChange 選び直しの通知先。渡さなければ通知を捨てる
 */
export function renderControl(
  value: Option<string>,
  onChange: (next: Option<string>) => void = vi.fn(),
): void {
  render(
    <>
      <span id={LABEL_ID}>Direction</span>
      <SegmentedControl
        labelledBy={LABEL_ID}
        options={["row", "column"]}
        value={value}
        onChange={onChange}
      />
    </>,
  );
}
