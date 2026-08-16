import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionState } from "../index";

test("名前を1つも渡さずに選択を作ると何も選ばれていない状態になる", () => {
  expect(SelectionState.create([]).kind).toBe("none");
});

test("名前を1つ渡して選択を作ると単一選択になる", () => {
  expect(SelectionState.create(["home-title"]).kind).toBe("single");
});

test("名前を2つ渡して選択を作ると複数選択になる", () => {
  expect(SelectionState.create(["home-login", "settings-login"]).kind).toBe(
    "multiple",
  );
});

test("単一選択のときは選ばれている1つの名前を取り出せる", () => {
  const selection = SelectionState.create(["home-title"]);

  expect(SelectionState.singleName(selection)).toEqual(
    Option.some("home-title"),
  );
});

test("複数選択のときは選ばれている1つの名前を取り出せない", () => {
  const selection = SelectionState.create(["home-login", "settings-login"]);

  expect(SelectionState.singleName(selection).some).toBe(false);
});

test("複数選択には渡した名前がすべて渡した順で入っている", () => {
  const selection = SelectionState.create([
    "home-login",
    "settings-login",
    "about-login",
  ]);

  expect(SelectionState.names(selection)).toEqual([
    "home-login",
    "settings-login",
    "about-login",
  ]);
});

test("選択に含まれる名前を尋ねると含まれると答える", () => {
  const selection = SelectionState.create(["home-login", "settings-login"]);

  expect(SelectionState.includes(selection, "settings-login")).toBe(true);
});

test("複数選択の件数は選ばれている名前の数になる", () => {
  const selection = SelectionState.create([
    "home-login",
    "settings-login",
    "about-login",
  ]);

  expect(SelectionState.count(selection)).toBe(3);
});
