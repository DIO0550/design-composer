import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { DistanceTargets } from "../index";

/*
 * 起点は左右 50〜70・上下 40〜50。右に兄弟（左右 100〜120）がいて、左には兄弟がいない。
 */
const From = { left: 50, top: 40, width: 20, height: 10 };
const RightSibling = { left: 100, top: 30, width: 20, height: 20 };

test("親の中の相手なら、左は親の縁まで、右は兄弟までの線になる", () => {
  expect(
    DistanceTargets.toDistances(
      {
        kind: "within-parent",
        parentBounds: { left: 0, top: 0, width: 200, height: 100 },
        siblings: [RightSibling],
      },
      From,
    ).horizontal,
  ).toEqual({
    start: Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 0, max: 50 },
    }),
    end: Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 100 },
    }),
  });
});

test("artboard の間の相手なら、親の縁を測らず他の artboard だけを測る", () => {
  expect(
    DistanceTargets.toDistances(
      { kind: "among-artboards", others: [RightSibling] },
      From,
    ).horizontal,
  ).toEqual({
    start: Option.none,
    end: Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 100 },
    }),
  });
});
