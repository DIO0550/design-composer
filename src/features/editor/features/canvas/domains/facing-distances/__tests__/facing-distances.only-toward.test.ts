import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { FacingDistances } from "../index";
import { From, Parent } from "./sample-bounds";

/*
 * 掴んだ辺の向きだけを残す距離（docs/06-ui.md「リサイズハンドル」の Alt / Option の距離）。
 * 兄弟が無いので、絞る前は上下左右とも親の縁までの線がある。
 */

/**
 * 上下左右とも親の縁まで線がある距離。
 *
 * @returns 4 方向に線がある距離
 */
function setupDistances(): FacingDistances {
  return FacingDistances.create({
    from: From,
    parentBounds: Parent,
    siblings: [],
  });
}

test("残す向きを 1 つ渡すと、4 方向に線があってもその向きの線だけが残る", () => {
  const distances = setupDistances();

  expect(
    FacingDistances.onlyToward(distances, [
      { pair: SidePairs.Horizontal, end: AxisEnds.End },
    ]),
  ).toEqual({
    horizontal: { start: Option.none, end: distances.horizontal.end },
    vertical: { start: Option.none, end: Option.none },
  });
});

test("角の 2 向きを渡すと、その 2 つだけが残る", () => {
  const distances = setupDistances();

  expect(
    FacingDistances.onlyToward(distances, [
      { pair: SidePairs.Horizontal, end: AxisEnds.End },
      { pair: SidePairs.Vertical, end: AxisEnds.Start },
    ]),
  ).toEqual({
    horizontal: { start: Option.none, end: distances.horizontal.end },
    vertical: { start: distances.vertical.start, end: Option.none },
  });
});

test("残す向きが空なら、どの向きにも線が無い", () => {
  expect(FacingDistances.onlyToward(setupDistances(), [])).toEqual(
    FacingDistances.None,
  );
});
