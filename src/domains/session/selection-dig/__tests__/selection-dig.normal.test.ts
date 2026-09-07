import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { SelectionDig, SelectionDigs } from "../index";

/**
 * 押された位置から外へ辿った、選べるノードの名前（内→外）。
 * `deep-title` が深さ 3、`outer-panel` が artboard 直下の子にあたる。
 */
const Candidates = ["deep-title", "inner-panel", "outer-panel"] as const;

test("掘らない指定では、いちばん外側の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.NoDeeper,
    Candidates,
    Option.none,
  );

  expect(Option.unwrap(name)).toBe("outer-panel");
});

test("掘らない指定でも、今の選択が候補に載っていればそのままになる", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.NoDeeper,
    Candidates,
    Option.some("inner-panel"),
  );

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("1 階層だけ掘る指定では、今の選択の 1 つ内側が選ばれる", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.OneDeeper,
    Candidates,
    Option.some("outer-panel"),
  );

  expect(Option.unwrap(name)).toBe("inner-panel");
});

test("1 階層だけ掘る指定でも、今の選択が候補に無ければいちばん外側が選ばれる", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.OneDeeper,
    Candidates,
    Option.some("another-branch"),
  );

  expect(Option.unwrap(name)).toBe("outer-panel");
});

test("掘れるだけ掘る指定では、今の選択に関わらずいちばん内側の候補が選ばれる", () => {
  const name = SelectionDig.nameAt(
    SelectionDigs.Deepest,
    Candidates,
    Option.some("outer-panel"),
  );

  expect(Option.unwrap(name)).toBe("deep-title");
});
