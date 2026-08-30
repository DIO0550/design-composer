import { expect, test } from "vitest";
import { type AbsolutePlacement, Placement } from "../index";

test("flow を指定するとフローの配置になる", () => {
  expect(Placement.fromProps({ placement: "flow", x: 40, y: 24 })).toEqual({
    mode: "flow",
  });
});

test("absolute と座標を指定すると絶対配置になる", () => {
  expect(Placement.fromProps({ placement: "absolute", x: 40, y: 24 })).toEqual({
    mode: "absolute",
    x: 40,
    y: 24,
  });
});

test("絶対配置は横の座標を left に、縦の座標を top に出す", () => {
  expect(
    Placement.declarations(
      Placement.fromProps({ placement: "absolute", x: 40, y: 24 }),
    ),
  ).toEqual([
    { property: "position", value: "absolute" },
    { property: "left", value: "40px" },
    { property: "top", value: "24px" },
  ]);
});

test("フローの配置は宣言を出さない", () => {
  expect(
    Placement.declarations(
      Placement.fromProps({ placement: "flow", x: 40, y: 24 }),
    ),
  ).toEqual([]);
});

test("フローに参加している配置は絶対配置ではない", () => {
  expect(Placement.isAbsolute(Placement.fromProps({ placement: "flow" }))).toBe(
    false,
  );
});

test("座標で置かれる配置は絶対配置である", () => {
  expect(
    Placement.isAbsolute(
      Placement.fromProps({ placement: "absolute", x: 40, y: 24 }),
    ),
  ).toBe(true);
});

test("座標をずらすと、ずらした分だけ動いた配置になる", () => {
  expect(
    Placement.moveBy({ mode: "absolute", x: 40, y: 24 }, { x: 12, y: -5 }),
  ).toEqual({ mode: "absolute", x: 52, y: 19 });
});

test("座標は整数へ丸める（倍率の割り戻しで出た端数を残さない）", () => {
  expect(
    Placement.moveBy({ mode: "absolute", x: 40, y: 24 }, { x: 0.6, y: 0.25 }),
  ).toEqual({ mode: "absolute", x: 41, y: 24 });
});

test("絶対配置を props の編集へ戻すと、横と縦の座標の 2 件になる", () => {
  expect(Placement.toPropEdits({ mode: "absolute", x: 40, y: 24 })).toEqual([
    { names: ["x"], value: { some: true, value: 40 } },
    { names: ["y"], value: { some: true, value: 24 } },
  ]);
});

test("2 つの配置の差は、前から後への移動量になる", () => {
  const from: AbsolutePlacement = { mode: "absolute", x: 40, y: 24 };
  const to: AbsolutePlacement = { mode: "absolute", x: 10, y: 36 };

  // 縦横で符号を違えて、取り違えと符号の反転を落とす
  expect(Placement.delta(from, to)).toEqual({ x: -30, y: 12 });
});
