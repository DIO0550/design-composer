import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { SideSnap } from "../index";

/** 左 100・上 100 に置かれた、幅 40・高さ 20 の運んでいるもの（右辺 140・下辺 120）。 */
const Moving: CanvasBounds = { left: 100, top: 100, width: 40, height: 20 };

test("運んでいるものの左辺が揃える先の左辺の近くにあると、左辺が重なる位置まで寄る", () => {
  // 左辺どうしが 4 離れているだけで、他の辺の組は遠い
  const stationary: CanvasBounds = {
    left: 104,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: 4,
    y: 0,
  });
});

test("運んでいるものの上辺が揃える先の上辺の近くにあると、上辺が重なる位置まで寄る", () => {
  const stationary: CanvasBounds = {
    left: 500,
    top: 95,
    width: 40,
    height: 200,
  };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: 0,
    y: -5,
  });
});

test("運んでいるものの左辺が揃える先の右辺の近くにあると、その辺どうしが重なる位置まで寄る", () => {
  // 右辺は 97。隣り合わせに並べる形（左辺どうしではない組で揃う）
  const stationary: CanvasBounds = {
    left: 40,
    top: 300,
    width: 57,
    height: 20,
  };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: -3,
    y: 0,
  });
});

test("横だけが近いときは、横だけが寄って縦は動かない", () => {
  // 縦を 0 と見るだけでは縦の実装を丸ごと壊しても通るので、同じ入力で横が寄ることと対で見る
  const stationary: CanvasBounds = {
    left: 103,
    top: 400,
    width: 40,
    height: 20,
  };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [stationary]))).toEqual({
    x: 3,
    y: 0,
  });
});

test("揃える先が複数あるときは、いちばん近い辺へ寄る", () => {
  const far: CanvasBounds = { left: 105, top: 300, width: 300, height: 20 };
  const near: CanvasBounds = { left: 102, top: 340, width: 300, height: 20 };

  expect(SideSnap.toOffset(SideSnap.create(Moving, [far, near]))).toEqual({
    x: 2,
    y: 0,
  });
});
