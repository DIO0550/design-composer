import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { SampleDocumentWithDeepBranch } from "@/features/editor/__tests__/sample-document";
import { EditMenuTarget, EditMenuTargets } from "../index";

/*
 * 押された位置から外へ辿った名前が、どの対象のメニューになるか
 * （docs/06-ui.md「コンテキストメニュー」の「出る場所」）。
 *
 * キャンバスは枠の名前を必ず末尾に足すので、末尾は常にその artboard 自身になる。
 */

/** `home` の直下に、ロックした `locked-panel`（中に `locked-title`）だけが置かれたドキュメント。 */
function setupLockedDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "locked-panel",
            type: "Box",
            props: { locking: "locked" },
            children: [{ name: "locked-title", type: "Text" }],
          },
        ],
      },
    ],
  });
}

test("名前が 1 つも無いときは空き領域になる", () => {
  expect(EditMenuTarget.fromNames(SampleDocumentWithDeepBranch, [])).toBe(
    EditMenuTargets.EmptyArea,
  );
});

test("名前が artboard 自身だけのときは artboard になる", () => {
  expect(EditMenuTarget.fromNames(SampleDocumentWithDeepBranch, ["home"])).toBe(
    EditMenuTargets.Artboard,
  );
});

test("artboard の内側のノードまで辿れているときはノードになる", () => {
  expect(
    EditMenuTarget.fromNames(SampleDocumentWithDeepBranch, [
      "outer-panel",
      "home",
    ]),
  ).toBe(EditMenuTargets.Node);
});

test("入れ子の奥まで辿れているときもノードになる", () => {
  expect(
    EditMenuTarget.fromNames(SampleDocumentWithDeepBranch, [
      "deep-title",
      "inner-panel",
      "outer-panel",
      "home",
    ]),
  ).toBe(EditMenuTargets.Node);
});

test("ロック中のノードの上を押したときは artboard になる", () => {
  expect(
    EditMenuTarget.fromNames(setupLockedDocument(), [
      "locked-title",
      "locked-panel",
      "home",
    ]),
  ).toBe(EditMenuTargets.Artboard);
});
