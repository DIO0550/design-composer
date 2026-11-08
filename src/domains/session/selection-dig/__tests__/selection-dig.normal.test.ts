import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionDig, SelectionDigs } from "../index";

/**
 * 押された位置から外へ辿った、選べるノードの名前（内→外）。
 * `deep-title` が深さ 3、`outer-panel` が artboard 直下の子にあたる。
 */
const Candidates = ["deep-title", "inner-panel", "outer-panel"] as const;

test("掘らない指定では、いちばん外側の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, Candidates, []);

  expect(Option.unwrap(name)).toBe("outer-panel");
});

test("掘らない指定でも、今の選択が候補に載っていればそのままになる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, Candidates, [
    "inner-panel",
  ]);

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("1 階層だけ掘る指定では、今の選択の 1 つ内側が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, Candidates, [
    "outer-panel",
  ]);

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("1 階層だけ掘る指定でも、今の選択が候補に無ければいちばん外側が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, Candidates, [
    "another-branch",
  ]);

  expect(Option.unwrap(name)).toBe("outer-panel");
});

test("掘れるだけ掘る指定では、今の選択に関わらずいちばん内側の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.Deepest, Candidates, [
    "outer-panel",
  ]);

  expect(Option.unwrap(name)).toBe("deep-title");
});

test("複数選択で押した位置が一員の内側なら、掘らない指定ではその一員が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, Candidates, [
    "another-branch",
    "inner-panel",
  ]);

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("複数選択で押した位置が一員の内側なら、1 階層だけ掘る指定ではその一員の 1 つ内側が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.OneDeeper, Candidates, [
    "another-branch",
    "inner-panel",
  ]);

  expect(Option.unwrap(name)).toBe("deep-title");
});

test("複数選択で押した位置がどの一員の内側でもなければ、artboard 直下の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.NoDeeper, Candidates, [
    "another-branch",
    "yet-another-branch",
  ]);

  expect(Option.unwrap(name)).toBe("outer-panel");
});

test("複数選択でも、掘れるだけ掘る指定では選択に依らずいちばん内側の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(SelectionDigs.Deepest, Candidates, [
    "another-branch",
    "outer-panel",
  ]);

  expect(Option.unwrap(name)).toBe("deep-title");
});
