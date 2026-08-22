import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { SelectionState } from "@/domains/selection-state";
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

/** その名前を選んでいる状態の対。 */
function setupSelecting(...names: readonly string[]): DocumentSelection {
  return DocumentSelection.create(
    setupDocument(),
    SelectionState.create(names),
  );
}

test("artboard を選んでいるときは artboard として読める", () => {
  const selection = Option.unwrap(
    DocumentSelection.singleSelection(setupSelecting("home")),
  );

  expect(selection).toEqual({ name: "home", kind: Option.some("artboard") });
});

test("ノードを選んでいるときはそのノードの型として読める", () => {
  const selection = Option.unwrap(
    DocumentSelection.singleSelection(setupSelecting("home-title")),
  );

  expect(selection).toEqual({ name: "home-title", kind: Option.some("Text") });
});

test("スキーマに無い型のノードを選んでいるときは種別が読めない", () => {
  const selection = Option.unwrap(
    DocumentSelection.singleSelection(setupSelecting("home-unknown")),
  );

  expect(selection.kind.some).toBe(false);
});

/*
 * 対は選択を映すだけで名前の実在を検証しない（型の doc）。実在しない名前は
 * ここで正体を引けないことになる。
 */
test("選んでいる名前がドキュメントに無いときは正体が読めない", () => {
  expect(DocumentSelection.singleSelection(setupSelecting("ghost")).some).toBe(
    false,
  );
});
