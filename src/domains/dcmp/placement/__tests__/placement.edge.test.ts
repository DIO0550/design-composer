import { expect, test } from "vitest";
import { Placement } from "../index";

test("絶対配置なのに横の座標が数値でないときは置き場所が決まらない", () => {
  expect(
    Placement.fromProps({ placement: "absolute", x: "40", y: 24 }),
  ).toBeUndefined();
});

test("絶対配置なのに縦の座標が数値でないときは置き場所が決まらない", () => {
  expect(
    Placement.fromProps({ placement: "absolute", x: 40, y: "24" }),
  ).toBeUndefined();
});

test("知らないモードのときは置き場所が決まらない", () => {
  expect(
    Placement.fromProps({ placement: "sticky", x: 40, y: 24 }),
  ).toBeUndefined();
});

test("置き場所が決まらない配置は座標の宣言を出さない", () => {
  expect(
    Placement.declarations(
      Placement.fromProps({ placement: "absolute", x: "40", y: 24 }),
    ),
  ).toEqual([]);
});

test("負の座標でも絶対配置になり、親の外へはみ出して置ける", () => {
  expect(
    Placement.declarations(
      Placement.fromProps({ placement: "absolute", x: -10, y: -20 }),
    ),
  ).toEqual([
    { property: "position", value: "absolute" },
    { property: "left", value: "-10px" },
    { property: "top", value: "-20px" },
  ]);
});
