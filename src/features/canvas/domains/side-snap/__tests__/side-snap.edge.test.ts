import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { SideSnap } from "../index";

/** 左 100・上 100 に置かれた、幅 40・高さ 20 の運んでいるもの（右辺 140・下辺 120）。 */
const Moving: CanvasBounds = { left: 100, top: 100, width: 40, height: 20 };

test("どの辺も届かない距離にしかなければ、寄せ量は縦横とも 0 になる", () => {
  const stationary: CanvasBounds = {
    left: 300,
    top: 300,
    width: 40,
    height: 20,
  };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: 0,
    y: 0,
  });
});

test("揃える先が 1 つも無ければ、寄せ量は縦横とも 0 になる", () => {
  expect(SideSnap.toOffset(SideSnap.create(Moving, []))).toEqual({
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

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: SideSnap.ThresholdPx,
    y: 0,
  });
});
