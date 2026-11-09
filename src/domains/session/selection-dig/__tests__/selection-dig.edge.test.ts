import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionDig, SelectionDigs } from "../index";

/** 押された位置から外へ辿った、選べるノードの名前（内→外）。 */
const Candidates = ["deep-title", "inner-panel", "outer-panel"] as const;

test("1 階層だけ掘る指定で、今の選択より内側が無ければ選択は変わらない", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, Candidates, [
    "deep-title",
  ]);

  expect(Option.unwrap(name)).toBe("deep-title");
});

test("候補が空なら、掘らない指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, [], ["deep-title"]);

  expect(Option.isSome(name)).toBe(false);
});

test("候補が空なら、1 階層だけ掘る指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, [], ["deep-title"]);

  expect(Option.isSome(name)).toBe(false);
});

test("候補が空なら、掘れるだけ掘る指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(SelectionDigs.Deepest, [], []);

  expect(Option.isSome(name)).toBe(false);
});

test("祖先と子孫の両方が選ばれて両方が候補に載るとき、掘らない指定では子孫が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, Candidates, [
    "outer-panel",
    "inner-panel",
  ]);

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("祖先と子孫の両方が選ばれて両方が候補に載るとき、1 階層だけ掘る指定では子孫の 1 つ内側が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, Candidates, [
    "outer-panel",
    "inner-panel",
  ]);

  expect(Option.unwrap(name)).toBe("deep-title");
});
