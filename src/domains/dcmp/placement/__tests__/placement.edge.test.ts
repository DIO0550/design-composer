import { expect, test } from "vitest";
import { Placement } from "../index";

test("絶対配置なのに座標が数値でないときは置き場所が決まらない", () => {
  expect(Placement.create("absolute", "40", 24)).toBeUndefined();
});

test("知らないモードのときは置き場所が決まらない", () => {
  expect(Placement.create("sticky", 40, 24)).toBeUndefined();
});

test("置き場所が決まらない配置は宣言を出さない", () => {
  expect(
    Placement.declarations(Placement.create("absolute", "40", 24)),
  ).toEqual([]);
});

test("負の座標でも絶対配置になり、親の外へはみ出して置ける", () => {
  expect(
    Placement.declarations(Placement.create("absolute", -10, -20)),
  ).toEqual([
    { property: "position", value: "absolute" },
    { property: "left", value: "-10px" },
    { property: "top", value: "-20px" },
  ]);
});
