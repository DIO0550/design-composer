import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { SideSnap } from "../index";
import { Moving } from "./moving-bounds";

test("掴んだ右辺が揃え先の右辺の近くにあると、右辺が重なるまで寄せる量になる", () => {
  // 右辺は 144。左辺どうし・左右の組は遠い
  const stationary: CanvasBounds = {
    left: 44,
    top: 300,
    width: 100,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(4);
});

test("掴んだ右辺が揃え先の左辺の近くにあると、その辺どうしが重なるまで寄せる量になる", () => {
  const stationary: CanvasBounds = {
    left: 137,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(-3);
});

test("掴んでいない左辺が揃え先の辺の近くにあっても寄せない", () => {
  // 左辺どうしは 3 離れているだけ。4 辺すべてを見る実装なら 3 寄る
  const stationary: CanvasBounds = {
    left: 103,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(0);
});

test("掴んだ辺が揃え先の中心線の近くにあっても寄せない", () => {
  // 左右の中心線は 138 で右辺 140 から 2 だけ。辺は 123 / 153 でどちらも届かない
  const stationary: CanvasBounds = {
    left: 123,
    top: 300,
    width: 30,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(0);
});

test("掴んだ辺が揃うとみなす距離ちょうどにあれば寄せる", () => {
  const stationary: CanvasBounds = {
    left: 46,
    top: 300,
    width: 100,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(SideSnap.ThresholdPx);
});

test("掴んだ辺が揃うとみなす距離より 1 でも離れていれば寄せない", () => {
  const stationary: CanvasBounds = {
    left: 47,
    top: 300,
    width: 100,
    height: 20,
  };

  expect(
    SideSnap.toEdgeShift(SideSnap.create(Moving, [stationary]), "width", "end"),
  ).toBe(0);
});

test("上辺を掴んだときは、上辺が揃え先の辺と重なるまで寄せる量になる", () => {
  // 上辺どうしが 5 離れている。下辺（120）はどの辺からも遠い
  const stationary: CanvasBounds = {
    left: 500,
    top: 95,
    width: 40,
    height: 200,
  };

  expect(
    SideSnap.toEdgeShift(
      SideSnap.create(Moving, [stationary]),
      "height",
      "start",
    ),
  ).toBe(-5);
});

test("同じ距離の揃え先が 2 つあると、先に並んだほうへ寄せる", () => {
  // 右辺が 143（+3）と 137（-3）。後ろを採る実装なら -3 になる
  const first: CanvasBounds = { left: 43, top: 300, width: 100, height: 20 };
  const second: CanvasBounds = { left: 37, top: 400, width: 100, height: 20 };

  expect(
    SideSnap.toEdgeShift(
      SideSnap.create(Moving, [first, second]),
      "width",
      "end",
    ),
  ).toBe(3);
});
