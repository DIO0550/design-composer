import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { GuideLineOverlay } from "../index";

/*
 * リサイズで掴んだ辺が揃ったときのガイド線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。
 * 線は移動と同じに出し、揃え先との隙間の数値は出さない。
 */

/** 揃え先の左辺（250）に中心を合わせた縦の線。左右の辺（水平の組）が揃った側。 */
const VerticalLine = { left: 249, top: 150, width: 2, height: 90 };

/** 揃え先の上辺（150）に中心を合わせた横の線。上下の辺（垂直の組）が揃った側。 */
const HorizontalLine = { left: 200, top: 149, width: 120, height: 2 };

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
          gapLine: Option.some({ left: 259, top: 200, width: 2, height: 40 }),
        }),
        vertical: Option.none,
      }}
    />,
  );

  expect(screen.getAllByTestId("snap-guide")).toHaveLength(1);
  expect(screen.queryAllByTestId("snap-gap")).toHaveLength(0);
});
