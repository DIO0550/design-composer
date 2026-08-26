import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
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

test("インスタンスを選んでいるときは元の部品の名前が読める", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-login",
  ]);

  expect(DocumentSelection.sourceName(selection)).toEqual(
    Option.some("primary-button"),
  );
});

test("インスタンス以外を選んでいるときは元の部品が無い", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-title",
  ]);

  expect(DocumentSelection.sourceName(selection).some).toBe(false);
});

test("同じ部品のインスタンスを複数選んでいるときも元の部品の名前が読める", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-login",
    "home-signup",
  ]);

  expect(DocumentSelection.sourceName(selection)).toEqual(
    Option.some("primary-button"),
  );
});

test("別々の部品のインスタンスを選んでいるときは元の部品が無い", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-login",
    "home-cancel",
  ]);

  expect(DocumentSelection.sourceName(selection).some).toBe(false);
});

test("インスタンスでないものが混ざっているときは元の部品が無い", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), [
    "home-login",
    "home-title",
  ]);

  expect(DocumentSelection.sourceName(selection).some).toBe(false);
});

test("何も選んでいないときは元の部品が無い", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), []);

  expect(DocumentSelection.sourceName(selection).some).toBe(false);
});
