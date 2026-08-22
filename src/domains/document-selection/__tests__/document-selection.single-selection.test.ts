import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { Option } from "@/utils/Option";

/**
 * 1 つだけ選んでいるときの正体（名前と種別）。インスペクタの見出しがこれを出す。
 *
 * artboard・ノード・スキーマに無い型のノードを 1 枚に並べて、種別の引き分けを
 * 同じドキュメントから確かめられるようにする。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "home-title", type: "Text" },
          { name: "home-unknown", type: "Gadget" },
        ],
      },
    ],
  });
}

test("artboard を選んでいるときは artboard として読める", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), ["home"]);

  expect(Option.unwrap(DocumentSelection.singleSelection(selection))).toEqual({
    name: "home",
    kind: Option.some("artboard"),
  });
});

test("ノードを選んでいるときはそのノードの型として読める", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-title",
  ]);

  expect(Option.unwrap(DocumentSelection.singleSelection(selection))).toEqual({
    name: "home-title",
    kind: Option.some("Text"),
  });
});

test("スキーマに無い型のノードを選んでいるときは種別が読めない", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-unknown",
  ]);

  expect(
    Option.unwrap(DocumentSelection.singleSelection(selection)).kind.some,
  ).toBe(false);
});

test("選んでいる名前がドキュメントに無いときは正体が読めない", () => {
  // 対は選択を映すだけで名前の実在を検証しない（型の doc）ので、引けないことになる
  const selection = DocumentSelection.fromNames(setupDocument(), ["ghost"]);

  expect(DocumentSelection.singleSelection(selection).some).toBe(false);
});

test("複数選んでいるときは正体が読めない", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-title",
    "home-unknown",
  ]);

  expect(DocumentSelection.singleSelection(selection).some).toBe(false);
});
