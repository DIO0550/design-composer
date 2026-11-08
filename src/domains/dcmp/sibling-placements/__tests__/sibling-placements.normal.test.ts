import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { Option } from "@/utils/Option";
import { SiblingPlacements } from "../index";

const placedAt = (parentName: string, x: number) =>
  ChildPlacement.create(parentName, { mode: "absolute", x, y: 0 });

test("位置を大きいものから渡しても、一員はツリー順に並ぶ", () => {
  const siblings = SiblingPlacements.fromChildPlacements([
    { name: "b", at: placedAt("home", 20), index: 2 },
    { name: "a", at: placedAt("home", 10), index: 0 },
  ]);

  expect(SiblingPlacements.names(Option.unwrap(siblings))).toEqual(["a", "b"]);
});

test("親が違うノードが混ざると、兄弟の座標は無い", () => {
  const siblings = SiblingPlacements.fromChildPlacements([
    { name: "a", at: placedAt("home", 10), index: 0 },
    { name: "b", at: placedAt("group", 20), index: 0 },
  ]);

  expect(Option.isSome(siblings)).toBe(false);
});

test("同じ名前が 2 回渡されても、一員は 1 つにまとまる", () => {
  const siblings = SiblingPlacements.fromChildPlacements([
    { name: "a", at: placedAt("home", 10), index: 1 },
    { name: "a", at: placedAt("home", 10), index: 1 },
  ]);

  expect(Option.unwrap(siblings)).toEqual({
    parentName: "home",
    placed: [{ name: "a", placement: { mode: "absolute", x: 10, y: 0 } }],
  });
});
