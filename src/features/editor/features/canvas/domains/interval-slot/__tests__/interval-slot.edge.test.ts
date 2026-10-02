import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { IntervalSlot } from "../index";
import { RowEnd, RowStart } from "./row-bounds";

test("縦の範囲が重ならない 2 つは、横の列として隣り合わない", () => {
  // 横には 20 離れているが、上下 40〜60 は RowStart の 0〜20 と重ならない
  const below: CanvasBounds = { left: 60, top: 40, width: 40, height: 20 };

  expect(IntervalSlot.collect([RowStart, below], SidePairs.Horizontal)).toEqual(
    [],
  );
});

test("縦の範囲が接するだけの 2 つも、横の列として隣り合わない", () => {
  // 上辺 20 が RowStart の下辺にちょうど乗っている（幅を持った重なりは無い）
  const touching: CanvasBounds = { left: 60, top: 20, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([RowStart, touching], SidePairs.Horizontal),
  ).toEqual([]);
});

test("間に別の子を挟む 2 つは隣り合わず、挟まれた子とそれぞれが隣り合う", () => {
  // RowStart〜middle は 5、middle〜right は 15。RowStart〜right の 30 は間隔にならない
  const middle: CanvasBounds = { left: 45, top: 0, width: 10, height: 20 };
  const right: CanvasBounds = { left: 70, top: 0, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([RowStart, right, middle], SidePairs.Horizontal),
  ).toEqual([
    {
      pair: SidePairs.Horizontal,
      neighbor: RowStart,
      end: AxisEnds.Start,
      interval: 5,
    },
    {
      pair: SidePairs.Horizontal,
      neighbor: right,
      end: AxisEnds.End,
      interval: 15,
    },
  ]);
});

test("列の途中にある子の隣には、同じ間隔の位置を置かない", () => {
  // 3 つが間隔 20 で並ぶ。位置が置かれるのは両端（RowStart の前と last の後ろ）だけ
  const middle: CanvasBounds = { left: 60, top: 0, width: 40, height: 20 };
  const last: CanvasBounds = { left: 120, top: 0, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([RowStart, middle, last], SidePairs.Horizontal).map(
      (slot) => slot.neighbor,
    ),
  ).toEqual([RowStart, last]);
});

test("接して並ぶ 2 つ（間隔 0）からは、同じ間隔の位置を集めない", () => {
  const adjacent: CanvasBounds = { left: 40, top: 0, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([RowStart, adjacent], SidePairs.Horizontal),
  ).toEqual([]);
});

test("兄弟が 1 つだけなら、同じ間隔の位置は無い", () => {
  expect(IntervalSlot.collect([RowStart], SidePairs.Horizontal)).toEqual([]);
});

test("運んでいるものが端の子と縦に重ならなければ、寄せ量を出さない", () => {
  const slot: IntervalSlot = {
    pair: SidePairs.Horizontal,
    neighbor: RowEnd,
    end: AxisEnds.End,
    interval: 20,
  };
  // 横は同じ間隔の位置の 3px 先（重なっていれば 3 が出る）。上下 30〜40 は端の子の 0〜20 と重ならない
  const moving: CanvasBounds = { left: 117, top: 30, width: 30, height: 10 };

  expect(IntervalSlot.toShift(slot, moving)).toEqual(Option.none);
});

test("同じ距離で最初に当たる子が 2 つあれば、並びで先の子だけを隣とみなす", () => {
  // 背の高い子の右 20 に、上下に接して積んだ 2 つ。後ろの子を採ると neighbor が lower になる
  const tall: CanvasBounds = { left: 0, top: 0, width: 40, height: 40 };
  const upper: CanvasBounds = { left: 60, top: 0, width: 40, height: 20 };
  const lower: CanvasBounds = { left: 60, top: 20, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([tall, upper, lower], SidePairs.Horizontal).map(
      (slot) => slot.neighbor,
    ),
  ).toEqual([tall, upper]);
});

test("接して並ぶ 2 つの先に離れた子があっても、接した子を飛ばして組を作らない", () => {
  // RowStart に接する touching の 20 先に far がある。間隔になるのは touching〜far の 20 だけ
  const touching: CanvasBounds = { left: 40, top: 0, width: 40, height: 20 };
  const far: CanvasBounds = { left: 100, top: 0, width: 40, height: 20 };

  expect(
    IntervalSlot.collect([RowStart, touching, far], SidePairs.Horizontal),
  ).toEqual([
    {
      pair: SidePairs.Horizontal,
      neighbor: far,
      end: AxisEnds.End,
      interval: 20,
    },
  ]);
});
