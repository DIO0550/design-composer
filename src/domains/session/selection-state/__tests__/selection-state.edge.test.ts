import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionState } from "../index";

test("何も選ばれていないときは1つの名前を取り出せない", () => {
  expect(Option.isSome(SelectionState.singleName(SelectionState.None))).toBe(
    false,
  );
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

test("同じ名前を 2 回渡して選択を作ると単一選択になる", () => {
  expect(SelectionState.create(["home-title", "home-title"])).toEqual({
    kind: "single",
    name: "home-title",
  });
});

test("重複を含む並びから選択を作ると、最初に現れた順で名前ごとに 1 件ずつ残る", () => {
  const selection = SelectionState.create([
    "home-title",
    "home-login",
    "home-title",
  ]);

  expect(SelectionState.names(selection)).toEqual(["home-title", "home-login"]);
});

test("重複を含む並びから作った選択の件数は、名前の種類の数になる", () => {
  const selection = SelectionState.create([
    "home-title",
    "home-login",
    "home-title",
  ]);

  expect(SelectionState.count(selection)).toBe(2);
});
