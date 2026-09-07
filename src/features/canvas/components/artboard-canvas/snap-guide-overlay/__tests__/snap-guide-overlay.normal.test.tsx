import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SnapGuideOverlay } from "../index";

/*
 * 揃った辺に引くガイド線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * どこへ引くかは実測から `side-snap` が決めるので、ここが見るのは渡された矩形を
 * そのまま線として出すかどうか。
 */

/** 揃え先の左辺（250）に中心を合わせた縦の線。 */
const VerticalGuide = { left: 249, top: 150, width: 2, height: 90 };

/** 揃え先の上辺（150）に中心を合わせた横の線。 */
const HorizontalGuide = { left: 200, top: 149, width: 120, height: 2 };

function guides(): readonly HTMLElement[] {
  return screen.queryAllByTestId("snap-guide");
}

test("揃った辺の数だけ線が出る", () => {
  render(<SnapGuideOverlay guides={[VerticalGuide, HorizontalGuide]} />);

  expect(guides()).toHaveLength(2);
});

test("縦の線は渡された矩形の位置と長さで出る", () => {
  // 幅と高さを取り違えると、縦線が横線になる
  render(<SnapGuideOverlay guides={[VerticalGuide]} />);

  expect(guides()[0].getAttribute("style")).toContain(
    "left: 249px; top: 150px; width: 2px; height: 90px",
  );
});

test("横の線は渡された矩形の位置と長さで出る", () => {
  render(<SnapGuideOverlay guides={[HorizontalGuide]} />);

  expect(guides()[0].getAttribute("style")).toContain(
    "left: 200px; top: 149px; width: 120px; height: 2px",
  );
});

test("揃った辺が無ければ線は 1 本も出ない", () => {
  render(<SnapGuideOverlay guides={[]} />);

  expect(guides()).toHaveLength(0);
});

test("線は読み上げられない", () => {
  // 揃ったことは辺が実際に揃うことで伝わるので、読み上げでは繰り返さない
  render(<SnapGuideOverlay guides={[VerticalGuide]} />);

  expect(guides()[0].getAttribute("aria-hidden")).toBe("true");
});
