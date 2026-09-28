import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { SideSnap } from "../index";
import { Moving } from "./moving-bounds";

test("どの辺も届かない距離にしかなければ、寄せ量は縦横とも 0 になる", () => {
  const stationary: CanvasBounds = {
    left: 300,
    top: 300,
    width: 40,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 0,
    y: 0,
  });
});

test("揃える先が 1 つも無ければ、寄せ量は縦横とも 0 になる", () => {
  expect(SideSnap.toSnapped(SideSnap.create(Moving, [])).offset).toEqual({
    x: 0,
    y: 0,
  });
});

test("揃うとみなす距離ちょうどでも寄る", () => {
  const stationary: CanvasBounds = {
    left: Moving.left + SideSnap.ThresholdPx,
    top: 300,
    width: 300,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: SideSnap.ThresholdPx,
    y: 0,
  });
});

test("同じ揃え先の辺と中心が同じ距離にあるときは、辺へ寄る", () => {
  // 左辺どうしは +4、中心どうし（120 と 116）は −4。符号を違えて、どちらを採ったかを寄せ量で見分ける
  const stationary: CanvasBounds = {
    left: 104,
    top: 300,
    width: 24,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 4,
    y: 0,
  });
});

test("辺と中心が同じ距離にあっても、揃え先の並びで先にあるほうへ寄る", () => {
  // 先の揃え先は中心どうし（−4）だけ、後の揃え先は左辺どうし（+4）だけが届く
  const first: CanvasBounds = { left: 56, top: 300, width: 120, height: 20 };
  const second: CanvasBounds = { left: 104, top: 340, width: 300, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [first, second])).offset,
  ).toEqual({
    x: -4,
    y: 0,
  });
});

test("辺より中心のほうが近ければ、中心へ寄る", () => {
  // 先の揃え先は左辺どうしが +5、後の揃え先は中心どうしが −2
  const first: CanvasBounds = { left: 105, top: 300, width: 300, height: 20 };
  const second: CanvasBounds = { left: 58, top: 340, width: 120, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [first, second])).offset,
  ).toEqual({
    x: -2,
    y: 0,
  });
});

test("中心も届くが辺のほうが近ければ、辺へ寄る", () => {
  // 先の揃え先は中心どうしが −5、後の揃え先は左辺どうしが +2
  const first: CanvasBounds = { left: 55, top: 300, width: 120, height: 20 };
  const second: CanvasBounds = { left: 102, top: 340, width: 300, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [first, second])).offset,
  ).toEqual({
    x: 2,
    y: 0,
  });
});
