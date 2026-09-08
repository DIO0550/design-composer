import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
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
