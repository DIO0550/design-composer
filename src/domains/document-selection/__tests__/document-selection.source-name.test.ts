import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { SelectionState } from "@/domains/selection-state";
import { Option } from "@/utils/Option";

/**
 * 選んでいるものの出どころの部品（UI 案 docs/Design Composer.html の
 * `from ◆ primary-button` / `Assets` の `source of selection`）。
 *
 * 2 つの部品を指すインスタンスと、インスタンスでないノードを 1 枚の artboard に
 * 並べて、混ざった選択と揃った選択を同じドキュメントから作れるようにする。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "home-title", type: "Text" },
          { name: "home-login", ref: "primary-button" },
          { name: "home-signup", ref: "primary-button" },
          { name: "home-cancel", ref: "secondary-button" },
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

test("インスタンスを選んでいるときは元の部品の名前が読める", () => {
  expect(DocumentSelection.sourceName(setupSelecting("home-login"))).toEqual(
    Option.some("primary-button"),
  );
});

test("インスタンス以外を選んでいるときは元の部品が無い", () => {
  expect(DocumentSelection.sourceName(setupSelecting("home-title")).some).toBe(
    false,
  );
});

test("同じ部品のインスタンスを複数選んでいるときも元の部品の名前が読める", () => {
  expect(
    DocumentSelection.sourceName(setupSelecting("home-login", "home-signup")),
  ).toEqual(Option.some("primary-button"));
});

test("別々の部品のインスタンスを選んでいるときは元の部品が無い", () => {
  expect(
    DocumentSelection.sourceName(setupSelecting("home-login", "home-cancel"))
      .some,
  ).toBe(false);
});

test("何も選んでいないときは元の部品が無い", () => {
  expect(DocumentSelection.sourceName(setupSelecting()).some).toBe(false);
});
