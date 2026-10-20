import { expect, test } from "vitest";
import { CanvasBounds } from "../index";

/** 左 10・上 20 に置かれた、幅 100・高さ 40 の矩形（右辺 110・下辺 60）。 */
const Bounds: CanvasBounds = { left: 10, top: 20, width: 100, height: 40 };

test("右辺を動かすと、左辺は留まり幅が変わる", () => {
  expect(
    CanvasBounds.withEdgeAt(Bounds, { axis: "width", end: "end" }, 150),
  ).toEqual({ left: 10, top: 20, width: 140, height: 40 });
});

test("左辺を動かすと、右辺は留まり左辺の位置と幅が変わる", () => {
  expect(
    CanvasBounds.withEdgeAt(Bounds, { axis: "width", end: "start" }, 30),
  ).toEqual({ left: 30, top: 20, width: 80, height: 40 });
});

test("下辺を動かすと、上辺は留まり高さが変わる", () => {
  expect(
    CanvasBounds.withEdgeAt(Bounds, { axis: "height", end: "end" }, 90),
  ).toEqual({ left: 10, top: 20, width: 100, height: 70 });
});

test("上辺を動かすと、下辺は留まり上辺の位置と高さが変わる", () => {
  expect(
    CanvasBounds.withEdgeAt(Bounds, { axis: "height", end: "start" }, 5),
  ).toEqual({ left: 10, top: 5, width: 100, height: 55 });
});

test("辺が反対の辺を越えると、左右を入れ替えず幅が負になる", () => {
  expect(
    CanvasBounds.withEdgeAt(Bounds, { axis: "width", end: "end" }, 0),
  ).toEqual({ left: 10, top: 20, width: -10, height: 40 });
});
