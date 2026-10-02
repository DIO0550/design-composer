import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { IntervalSlot } from "../index";
import { RowEnd, RowStart } from "./row-bounds";

/** 縦に間隔 20 で並ぶ 2 つ（上 0〜40 と 60〜100、左右はどちらも 0〜20）。 */
const Upper: CanvasBounds = { left: 0, top: 0, width: 20, height: 40 };
const Lower: CanvasBounds = { left: 0, top: 60, width: 20, height: 40 };

/**
 * 並びから集めた位置のうち、指定した側のもの。
 *
 * @param siblings 兄弟の並び
 * @param facing 列の向きと、端のどちら側か
 * @returns その側の位置。無ければテストを落とす
 */
function slotAt(
  siblings: readonly CanvasBounds[],
  facing: Pick<IntervalSlot, "pair" | "end">,
): IntervalSlot {
  const slots = IntervalSlot.collect(siblings, facing.pair).filter(
    (candidate) => candidate.end === facing.end,
  );
  expect(slots).toHaveLength(1);
  return slots[0];
}

test("横に並ぶ 2 つの兄弟から、列の両端の隣に同じ間隔の位置が集まる", () => {
  expect(
    IntervalSlot.collect([RowStart, RowEnd], SidePairs.Horizontal),
  ).toEqual([
    {
      pair: SidePairs.Horizontal,
      neighbor: RowStart,
      end: AxisEnds.Start,
      interval: 20,
    },
    {
      pair: SidePairs.Horizontal,
      neighbor: RowEnd,
      end: AxisEnds.End,
      interval: 20,
    },
  ]);
});

test("列の右端の隣へ運ぶと、右端から同じ間隔になる位置への寄せ量が出る", () => {
  const slot = slotAt([RowStart, RowEnd], {
    pair: SidePairs.Horizontal,
    end: AxisEnds.End,
  });
  // 右端 100 から 20 先の 120 に左辺が来る位置。いまの左辺は 117
  const moving: CanvasBounds = { left: 117, top: 5, width: 30, height: 10 };

  expect(IntervalSlot.toShift(slot, moving)).toEqual(Option.some(3));
});

test("列の左端の隣へ運ぶと、左端から同じ間隔になる位置への寄せ量が出る", () => {
  const slot = slotAt([RowStart, RowEnd], {
    pair: SidePairs.Horizontal,
    end: AxisEnds.Start,
  });
  // 左端 0 から 20 手前の -20 に右辺が来る位置。いまの右辺は -22
  const moving: CanvasBounds = { left: -52, top: 5, width: 30, height: 10 };

  expect(IntervalSlot.toShift(slot, moving)).toEqual(Option.some(2));
});

test("列の下端の隣へ運ぶと、下端から同じ間隔になる位置への寄せ量が出る", () => {
  const slot = slotAt([Upper, Lower], {
    pair: SidePairs.Vertical,
    end: AxisEnds.End,
  });
  // 下端 100 から 20 先の 120 に上辺が来る位置。いまの上辺は 117
  const moving: CanvasBounds = { left: 5, top: 117, width: 10, height: 30 };

  expect(IntervalSlot.toShift(slot, moving)).toEqual(Option.some(3));
});

test("列の上端の隣へ運ぶと、上端から同じ間隔になる位置への寄せ量が出る", () => {
  const slot = slotAt([Upper, Lower], {
    pair: SidePairs.Vertical,
    end: AxisEnds.Start,
  });
  // 上端 0 から 20 手前の -20 に下辺が来る位置。いまの下辺は -22
  const moving: CanvasBounds = { left: 5, top: -52, width: 10, height: 30 };

  expect(IntervalSlot.toShift(slot, moving)).toEqual(Option.some(2));
});
