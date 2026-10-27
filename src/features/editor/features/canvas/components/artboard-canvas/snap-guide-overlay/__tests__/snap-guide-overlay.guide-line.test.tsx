import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { GuideLineOverlay } from "../index";
import { HorizontalLine, VerticalLine } from "./guide-lines";

/*
 * リサイズで掴んだ辺が揃ったときのガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 線はノードの移動と同じに出し、揃え先との隙間の数値は出さない（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 */

test("揃った線の数だけガイド線が出る", () => {
  render(
    <GuideLineOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.none,
        }),
        vertical: Option.some({
          guideLine: HorizontalLine,
          gapLine: Option.none,
        }),
      }}
    />,
  );

  expect(screen.queryAllByTestId("snap-guide")).toHaveLength(2);
});

test("ガイド線は渡された矩形の位置と長さで出る", () => {
  render(
    <GuideLineOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.none,
        }),
        vertical: Option.none,
      }}
    />,
  );

  expect(screen.getByTestId("snap-guide").getAttribute("style")).toContain(
    "left: 249px; top: 150px; width: 2px; height: 90px",
  );
});

test("揃え先から離れていても、隙間の数値は出さない", () => {
  // 隙間の短い線は高さ 40。移動のガイド（等倍）なら「40」が出る
  render(
    <GuideLineOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.some({
            along: SidePairs.Vertical,
            at: 260,
            span: { min: 200, max: 240 },
          }),
        }),
        vertical: Option.none,
      }}
    />,
  );

  expect(screen.getAllByTestId("snap-guide")).toHaveLength(1);
  expect(screen.queryAllByTestId("snap-gap")).toHaveLength(0);
});
