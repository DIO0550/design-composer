import { expect, test } from "vitest";
import { SetEx } from "@/utils/SetEx";

test("入っていない値を切り替えると入った集合になる", () => {
  expect(SetEx.toggle(new Set(["a"]), "b")).toEqual(new Set(["a", "b"]));
});

test("入っている値を切り替えるとその値だけが取り除かれ、他の値は残る", () => {
  expect(SetEx.toggle(new Set(["a", "b"]), "b")).toEqual(new Set(["a"]));
});

test("同じ値を2回切り替えると元の集合に戻る", () => {
  const toggledTwice = SetEx.toggle(SetEx.toggle(new Set(["a"]), "b"), "b");

  expect(toggledTwice).toEqual(new Set(["a"]));
});

test("値を切り替えても切り替える前の集合は変わらない", () => {
  const before = new Set(["a"]);

  SetEx.toggle(before, "b");

  expect(before).toEqual(new Set(["a"]));
});

test("空の集合に値を切り替えるとその値だけの集合になる", () => {
  expect(SetEx.toggle(new Set<string>(), "a")).toEqual(new Set(["a"]));
});
