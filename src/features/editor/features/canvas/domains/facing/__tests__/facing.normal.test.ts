import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { Facing } from "../index";

/** 進み始める、左上 (0, 0) の 10 四方の矩形。 */
const From: CanvasBounds = { left: 0, top: 0, width: 10, height: 10 };

const Right: Facing = { pair: SidePairs.Horizontal, end: AxisEnds.End };
const Left: Facing = { pair: SidePairs.Horizontal, end: AxisEnds.Start };
const Up: Facing = { pair: SidePairs.Vertical, end: AxisEnds.Start };
const Down: Facing = { pair: SidePairs.Vertical, end: AxisEnds.End };

test("右へ進むと、右にいる相手に当たる", () => {
  const right = { left: 20, top: 0, width: 10, height: 10 };
  const left = { left: -20, top: 0, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, { from: From, candidates: [left, right] }),
  ).toEqual(Option.some(right));
});

test("左へ進むと、左にいる相手に当たる", () => {
  const right = { left: 20, top: 0, width: 10, height: 10 };
  const left = { left: -20, top: 0, width: 10, height: 10 };

  expect(
    Facing.firstReached(Left, { from: From, candidates: [right, left] }),
  ).toEqual(Option.some(left));
});

test("上へ進むと、上にいる相手に当たる", () => {
  const above = { left: 0, top: -20, width: 10, height: 10 };
  const below = { left: 0, top: 20, width: 10, height: 10 };

  expect(
    Facing.firstReached(Up, { from: From, candidates: [below, above] }),
  ).toEqual(Option.some(above));
});

test("下へ進むと、下にいる相手に当たる", () => {
  const above = { left: 0, top: -20, width: 10, height: 10 };
  const below = { left: 0, top: 20, width: 10, height: 10 };

  expect(
    Facing.firstReached(Down, { from: From, candidates: [above, below] }),
  ).toEqual(Option.some(below));
});

test("進む向きに相手が 2 つあるなら、近いほうに当たる", () => {
  const far = { left: 40, top: 0, width: 10, height: 10 };
  const near = { left: 20, top: 0, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, { from: From, candidates: [far, near] }),
  ).toEqual(Option.some(near));
});

test("同じ距離に相手が 2 つあるなら、並びの先に当たる", () => {
  const first = { left: 20, top: -5, width: 10, height: 10 };
  const second = { left: 20, top: 5, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, { from: From, candidates: [first, second] }),
  ).toEqual(Option.some(first));
});

test("接している相手には、距離 0 で当たる", () => {
  const touching = { left: 10, top: 0, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, { from: From, candidates: [touching] }),
  ).toEqual(Option.some(touching));
  expect(Facing.distanceTo(Right, { from: From, to: touching })).toBe(0);
});

test("進む向きと直交する向きで接するだけの相手には当たらない", () => {
  const touchingAcross = { left: 20, top: 10, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, { from: From, candidates: [touchingAcross] }),
  ).toEqual(Option.none);
});

test("後ろにいる相手と、重なっている相手には当たらない", () => {
  const behind = { left: -20, top: 0, width: 10, height: 10 };
  const overlapping = { left: 5, top: 0, width: 10, height: 10 };

  expect(
    Facing.firstReached(Right, {
      from: From,
      candidates: [behind, overlapping],
    }),
  ).toEqual(Option.none);
});

test("並びに起点自身があっても、自分には当たらない", () => {
  // 幅 0 の起点は、自分との距離が 0 になって自分に当たりうる
  const line = { left: 0, top: 0, width: 0, height: 10 };

  expect(
    Facing.firstReached(Right, { from: line, candidates: [line] }),
  ).toEqual(Option.none);
});
