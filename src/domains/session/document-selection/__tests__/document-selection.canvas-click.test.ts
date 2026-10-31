import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { Option } from "@/utils/Option";

/**
 * キャンバスで押された位置から、クリックが選ぶもの（docs/06-ui.md「キャンバスのクリックが
 * 選ぶ階層」）。ノードの決め方は `nodeNameAt` のテストが見るので、ここが見るのは選べる
 * ノードが無いときに artboard へ倒すかどうか。
 *
 * `home` の直下に Box の `card`、その中に Text の `label`。隣の `sealed` はロックした Box で、
 * 中に `sealed-title` がある。`login` は部品 `primary-button` のインスタンスで、キャンバス
 * には定義の中の `primary-button-label` が中身として描かれる。
 */
function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "card",
              type: "Box",
              children: [{ name: "label", type: "Text" }],
            },
            {
              name: "sealed",
              type: "Box",
              props: { locking: "locked" },
              children: [{ name: "sealed-title", type: "Text" }],
            },
            { name: "login", ref: "primary-button" },
          ],
        },
      ],
    }),
    [],
  );
}

test("ノードを指していれば、掘る量どおりのノードを選ぶ", () => {
  const name = DocumentSelection.nameToSelectAt(
    setupSelection(),
    ["label", "card", "home"],
    SelectionDigs.Deepest,
  );

  expect(name).toEqual(Option.some("label"));
});

test("artboard の背景を指すと、その artboard を選ぶ", () => {
  const name = DocumentSelection.nameToSelectAt(
    setupSelection(),
    ["home"],
    SelectionDigs.NoDeeper,
  );

  expect(name).toEqual(Option.some("home"));
});

test("ロック中のノードしか無い枝を指すと、その artboard を選ぶ", () => {
  const name = DocumentSelection.nameToSelectAt(
    setupSelection(),
    ["sealed-title", "sealed", "home"],
    SelectionDigs.Deepest,
  );

  expect(name).toEqual(Option.some("home"));
});

test("部品定義の中の名前だけを指しても、何も選ばない", () => {
  const name = DocumentSelection.nameToSelectAt(
    setupSelection(),
    ["primary-button-label"],
    SelectionDigs.Deepest,
  );

  expect(name).toEqual(Option.none);
});

test("名前を 1 つも辿れなければ、何も選ばない", () => {
  const name = DocumentSelection.nameToSelectAt(
    setupSelection(),
    [],
    SelectionDigs.NoDeeper,
  );

  expect(name).toEqual(Option.none);
});
