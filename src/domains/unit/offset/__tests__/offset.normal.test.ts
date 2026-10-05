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

test("係数を掛けると、縦横のどちらもその倍になる", () => {
  expect(Offset.scale({ x: 3, y: -2 }, 10)).toEqual({ x: 30, y: -20 });
});

test("2 点の距離は向きに依らない 1 つの値になる", () => {
  expect(Offset.distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
});

test("原点は縦横とも 0 の位置", () => {
  expect(Offset.Origin).toEqual({ x: 0, y: 0 });
});

test("0 度回した差は元の差と同じになる", () => {
  expect(Offset.rotate({ x: 30, y: -12 }, 0)).toEqual({ x: 30, y: -12 });
});

test("右向きの差を 90 度回すと下向きになる", () => {
  const rotated = Offset.rotate({ x: 30, y: 0 }, 90);
  expect(rotated.x).toBeCloseTo(0);
  expect(rotated.y).toBeCloseTo(30);
});

test("右向きの差を 30 度回すと長さを保ったまま右下へ向く", () => {
  const rotated = Offset.rotate({ x: 20, y: 0 }, 30);
  expect(rotated.x).toBeCloseTo(17.32, 2);
  expect(rotated.y).toBeCloseTo(10, 2);
});

test("負の角度は反時計回りに回す", () => {
  const rotated = Offset.rotate({ x: 30, y: 0 }, -90);
  expect(rotated.x).toBeCloseTo(0);
  expect(rotated.y).toBeCloseTo(-30);
});
