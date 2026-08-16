import { expect, test } from "vitest";
import { SelectionState } from "../index";

test("何も選ばれていないときは1つの名前を取り出せない", () => {
  expect(SelectionState.singleName(SelectionState.None).some).toBe(false);
});

test("何も選ばれていないときの名前の並びは空になる", () => {
  expect(SelectionState.names(SelectionState.None)).toEqual([]);
});

test("何も選ばれていないときの件数は0になる", () => {
  expect(SelectionState.count(SelectionState.None)).toBe(0);
});

test("選択に含まれない名前を尋ねると含まれないと答える", () => {
  const selection = SelectionState.create(["home-login", "settings-login"]);

  expect(SelectionState.includes(selection, "about-login")).toBe(false);
});

test("何も選ばれていないときはどの名前も含まれないと答える", () => {
  expect(SelectionState.includes(SelectionState.None, "home-login")).toBe(
    false,
  );
});

test("単一選択の件数は1になる", () => {
  expect(SelectionState.count(SelectionState.create(["home-title"]))).toBe(1);
});
