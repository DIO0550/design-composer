import { expect, test } from "vitest";
import { Offset } from "../index";

test("幅の軸に沿った成分は横の値になる", () => {
  expect(Offset.along({ x: 30, y: 12 }, "width")).toBe(30);
});

test("高さの軸に沿った成分は縦の値になる", () => {
  expect(Offset.along({ x: 30, y: 12 }, "height")).toBe(12);
});

test("差を足すと、その分だけ動いた位置になる", () => {
  expect(Offset.add({ x: 30, y: 12 }, { x: 5, y: -3 })).toEqual({
    x: 35,
    y: 9,
  });
});

test("2 点の差は、後の点から前の点を引いた値になる", () => {
  expect(Offset.delta({ x: 30, y: 12 }, { x: 35, y: 9 })).toEqual({
    x: 5,
    y: -3,
  });
});

test("2 点の距離は向きに依らない 1 つの値になる", () => {
  expect(Offset.distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
});

test("原点は縦横とも 0 の位置", () => {
  expect(Offset.Origin).toEqual({ x: 0, y: 0 });
});
