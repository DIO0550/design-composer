import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SiblingPositions } from "../index";

test("同じ親の位置を大きいものから渡しても、小さい順に並ぶ", () => {
  expect(
    Option.unwrap(
      SiblingPositions.fromChildPositions([
        { parentName: "home", index: 2 },
        { parentName: "home", index: 0 },
      ]),
    ),
  ).toEqual({ parentName: "home", indices: [0, 2] });
});

test("親が違う位置が混ざると、兄弟の位置は無い", () => {
  expect(
    Option.isSome(
      SiblingPositions.fromChildPositions([
        { parentName: "home", index: 0 },
        { parentName: "group", index: 0 },
      ]),
    ),
  ).toBe(false);
});

test("同じ位置が 2 回渡されても、位置は 1 つにまとまる", () => {
  expect(
    Option.unwrap(
      SiblingPositions.fromChildPositions([
        { parentName: "home", index: 1 },
        { parentName: "home", index: 1 },
      ]),
    ),
  ).toEqual({ parentName: "home", indices: [1] });
});

test("離れた兄弟を抜いた並びでは、位置がいちばん大きかった兄弟の位置は、それより小さい位置で抜けた数だけ小さくなる", () => {
  expect(
    SiblingPositions.lastAfterRemoving({
      parentName: "home",
      indices: [1, 3],
    }),
  ).toEqual({ parentName: "home", index: 2 });
});

test("兄弟が 1 つだけなら、抜いた並びでもその位置のまま", () => {
  expect(
    SiblingPositions.lastAfterRemoving({
      parentName: "home",
      indices: [2],
    }),
  ).toEqual({ parentName: "home", index: 2 });
});
