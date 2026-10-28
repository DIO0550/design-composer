import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Option } from "@/utils/Option";
import { FacingDistanceOverlay } from "../index";

/*
 * 運んでいる間の Alt / Option の距離（docs/06-ui.md「キャンバス直接操作」）。どの相手まで測るかは
 * `facing-distances` が決めるので、ここが見るのは渡された線を描く矩形にして出すかどうかと、
 * 数値をどの単位で出すか。
 */

/** 等倍の表示。画面上の長さがそのままドキュメント上の長さになる。 */
const SameSize = CanvasView.create();

/** 上へ進んで当たる相手までの線（縦に長さ 40）。 */
const UpLine = {
  along: SidePairs.Vertical,
  at: 60,
  span: { min: 0, max: 40 },
};

/** 右へ進んで当たる相手までの線（横に長さ 130）。 */
const RightLine = {
  along: SidePairs.Horizontal,
  at: 45,
  span: { min: 70, max: 200 },
};

test("距離のある向きの数だけ、短い線と数値が出る", () => {
  render(
    <FacingDistanceOverlay
      distances={{
        horizontal: { start: Option.none, end: Option.some(RightLine) },
        vertical: { start: Option.some(UpLine), end: Option.none },
      }}
      view={SameSize}
    />,
  );

  expect(screen.queryAllByTestId("facing-distance")).toHaveLength(2);
});

test("短い線は、渡された線の位置と長さで出る", () => {
  render(
    <FacingDistanceOverlay
      distances={{
        ...FacingDistances.None,
        vertical: { start: Option.some(UpLine), end: Option.none },
      }}
      view={SameSize}
    />,
  );

  expect(screen.getByTestId("facing-distance").getAttribute("style")).toContain(
    "left: 59px; top: 0px; width: 2px; height: 40px",
  );
});

test("数値はドキュメント上の px で出る", () => {
  // 倍率 2 で画面上 40 の線は、ドキュメント上 20
  render(
    <FacingDistanceOverlay
      distances={{
        ...FacingDistances.None,
        vertical: { start: Option.some(UpLine), end: Option.none },
      }}
      view={{ ...SameSize, scale: 2 }}
    />,
  );

  expect(screen.getByTestId("facing-distance-label").textContent).toBe("20");
});

test("ドキュメント上の px へ丸めると 0 になる向きは出ない", () => {
  // 上は画面上 0.4 で丸めると 0。右は対照として出る
  render(
    <FacingDistanceOverlay
      distances={{
        horizontal: { start: Option.none, end: Option.some(RightLine) },
        vertical: {
          start: Option.some({ ...UpLine, span: { min: 39.6, max: 40 } }),
          end: Option.none,
        },
      }}
      view={SameSize}
    />,
  );

  expect(
    screen
      .queryAllByTestId("facing-distance-label")
      .map((label) => label.textContent),
  ).toEqual(["130"]);
});

test("短い線と数値は読み上げられない", () => {
  // 距離は置いた位置を見て分かるものなので、読み上げでは繰り返さない
  render(
    <FacingDistanceOverlay
      distances={{
        ...FacingDistances.None,
        vertical: { start: Option.some(UpLine), end: Option.none },
      }}
      view={SameSize}
    />,
  );

  expect(
    screen.getByTestId("facing-distance").getAttribute("aria-hidden"),
  ).toBe("true");
});
