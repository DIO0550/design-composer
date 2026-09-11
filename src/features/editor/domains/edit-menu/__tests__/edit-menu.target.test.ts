import { expect, test } from "vitest";
import { EditMenuTarget, EditMenuTargets } from "../index";

/*
 * 押された位置から外へ辿った名前が、どの対象のメニューになるか
 * （docs/06-ui.md「コンテキストメニュー」の「出る場所」）。
 *
 * キャンバスは枠の名前を必ず末尾に足すので、末尾は常にその artboard 自身になる。
 */

test("名前が 1 つも無いときは空き領域になる", () => {
  expect(EditMenuTarget.fromNames([])).toBe(EditMenuTargets.EmptyArea);
});

test("名前が artboard 自身だけのときは artboard になる", () => {
  expect(EditMenuTarget.fromNames(["home"])).toBe(EditMenuTargets.Artboard);
});

test("artboard の内側のノードまで辿れているときはノードになる", () => {
  expect(EditMenuTarget.fromNames(["title", "home"])).toBe(
    EditMenuTargets.Node,
  );
});

test("入れ子の奥まで辿れているときもノードになる", () => {
  expect(
    EditMenuTarget.fromNames([
      "deep-title",
      "inner-panel",
      "outer-panel",
      "home",
    ]),
  ).toBe(EditMenuTargets.Node);
});
