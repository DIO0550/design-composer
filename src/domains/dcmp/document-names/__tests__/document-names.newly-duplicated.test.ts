import { expect, test } from "vitest";
import { DocumentNames } from "../index";

function newlyDuplicated(
  before: readonly string[],
  after: readonly string[],
): readonly string[] {
  return DocumentNames.newlyDuplicatedNames({
    before: DocumentNames.create(before),
    after: DocumentNames.create(after),
  });
}

test("前に無かった名前が後で 2 回現れるなら、新しく重複した名前になる", () => {
  expect(newlyDuplicated(["home"], ["home", "label", "label"])).toEqual([
    "label",
  ]);
});

test("前に 1 回だった名前が後で 2 回になるなら、新しく重複した名前になる", () => {
  expect(
    newlyDuplicated(["home", "label"], ["home", "label", "label"]),
  ).toEqual(["label"]);
});

test("前から 2 回だった名前が後でも 2 回なら、新しく重複した名前にならない", () => {
  expect(
    newlyDuplicated(["label", "home", "label"], ["label", "label", "home"]),
  ).toEqual([]);
});

test("前から 2 回だった名前が後で 3 回になるなら、新しく重複した名前になる", () => {
  expect(
    newlyDuplicated(["label", "label"], ["label", "label", "label"]),
  ).toEqual(["label"]);
});

test("前に 3 回だった名前が後で 2 回に減るなら、まだ重複していても新しく重複した名前にならない", () => {
  expect(
    newlyDuplicated(["label", "label", "label"], ["label", "label"]),
  ).toEqual([]);
});

test("後で 1 回しか現れない新しい名前は、新しく重複した名前にならない", () => {
  expect(newlyDuplicated(["home"], ["home", "label"])).toEqual([]);
});

test("新しく重複した名前が 2 つあるとき、後で最初に現れた順に並ぶ", () => {
  expect(
    newlyDuplicated(["home"], ["home", "title", "label", "label", "title"]),
  ).toEqual(["title", "label"]);
});
