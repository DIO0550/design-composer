import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { SideSnap } from "../index";
import { Moving } from "./moving-bounds";

test("運んでいるものの左辺が揃える先の左辺の近くにあると、左辺が重なる位置まで寄る", () => {
  // 左辺どうしが 4 離れているだけで、他の辺の組は遠い
  const stationary: CanvasBounds = {
    left: 104,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
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

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
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

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
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

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 3,
    y: 0,
  });
});

test("揃える先が複数あるときは、いちばん近い辺へ寄る", () => {
  const far: CanvasBounds = { left: 105, top: 300, width: 300, height: 20 };
  const near: CanvasBounds = { left: 102, top: 340, width: 300, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [far, near])).offset,
  ).toEqual({
    x: 2,
    y: 0,
  });
});

test("運んでいるものの右辺が揃える先の右辺の近くにあると、右辺が重なる位置まで寄る", () => {
  // 右辺どうしが 3 離れている。左辺どうし（-60）は届かないので、決め手は右辺しかない
  const stationary: CanvasBounds = {
    left: 40,
    top: 300,
    width: 103,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 3,
    y: 0,
  });
});

test("運んでいるものの下辺が揃える先の下辺の近くにあると、下辺が重なる位置まで寄る", () => {
  // 下辺どうしが 4 離れている。上辺どうし（-40）は届かない
  const stationary: CanvasBounds = {
    left: 500,
    top: 60,
    width: 40,
    height: 56,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 0,
    y: -4,
  });
});

test("同じ距離の辺が 2 つあるときは、揃え先の並びで先にあるほうへ寄る", () => {
  // 片側だけの入力では優先順位を反転しても答えが変わらないので、同距離を対で置く
  const first: CanvasBounds = { left: 104, top: 300, width: 200, height: 20 };
  const second: CanvasBounds = { left: 96, top: 340, width: 200, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [first, second])).offset,
  ).toEqual({
    x: 4,
    y: 0,
  });
});

test("運んでいるものの横の中心が揃える先の横の中心の近くにあると、中心が重なる位置まで寄る", () => {
  // 横の中心は 120 と 123。辺どうしはどの組も 30 以上離れている
  const stationary: CanvasBounds = {
    left: 63,
    top: 300,
    width: 120,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 3,
    y: 0,
  });
});

test("運んでいるものの縦の中心が揃える先の縦の中心の近くにあると、中心が重なる位置まで寄る", () => {
  // 縦の中心は 110 と 112。辺どうしはどの組も 40 以上離れている
  const stationary: CanvasBounds = {
    left: 500,
    top: 60,
    width: 40,
    height: 104,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 0,
    y: 2,
  });
});

test("運んでいるものの中心が揃える先の辺の近くにあるだけでは、中心と辺は揃えない", () => {
  /*
   * 運んでいるものの横の中心（120）は揃え先の左辺（123）から 3 しか離れていないが、横は
   * 寄らない。縦は上辺どうし・下辺どうしが −5 で寄るので、同じ入力で寄る側と対で見る。
   */
  const stationary: CanvasBounds = {
    left: 123,
    top: 95,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 0,
    y: -5,
  });
});

test("揃える先の横の中心が運んでいるものの辺の近くにあるだけでは、中心と辺は揃えない", () => {
  /*
   * 揃え先の横の中心（103）は運んでいるものの左辺（100）から 3 しか離れていないが、横は
   * 寄らない。縦は上辺どうし・下辺どうし・中心どうしが −5 で寄るので、対で見る。
   */
  const stationary: CanvasBounds = {
    left: 43,
    top: 95,
    width: 120,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 0,
    y: -5,
  });
});

test("揃える先の縦の中心が運んでいるものの辺の近くにあるだけでは、中心と辺は揃えない", () => {
  /*
   * 揃え先の縦の中心（103）は運んでいるものの上辺（100）から 3 しか離れていないが、縦は
   * 寄らない。横は左辺どうし・右辺どうし・中心どうしが +4 で寄るので、対で見る。
   */
  const stationary: CanvasBounds = {
    left: 104,
    top: 57,
    width: 40,
    height: 92,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).offset,
  ).toEqual({
    x: 4,
    y: 0,
  });
});
