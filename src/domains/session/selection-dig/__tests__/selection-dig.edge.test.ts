import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionDig, SelectionDigs } from "../index";

/** 押された位置から外へ辿った、選べるノードの名前（内→外）。 */
const Candidates = ["deep-title", "inner-panel", "outer-panel"] as const;

test("1 階層だけ掘る指定で、今の選択より内側が無ければ選択は変わらない", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.OneDeeper,
    Candidates,
    Option.some("deep-title"),
  );

  expect(Option.unwrap(name)).toBe("deep-title");
});

test("候補が空なら、掘らない指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.NoDeeper,
    [],
    Option.some("deep-title"),
  );

  expect(name.some).toBe(false);
});

test("候補が空なら、1 階層だけ掘る指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.OneDeeper,
    [],
    Option.some("deep-title"),
  );

  expect(name.some).toBe(false);
});

test("候補が空なら、掘れるだけ掘る指定でも名前は決まらない", () => {
  const name = SelectionDig.nameAt(SelectionDigs.Deepest, [], Option.none);

  expect(name.some).toBe(false);
});
