import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { Option } from "@/utils/Option";

/**
 * キャンバスで押された位置から決まるノード（docs/06-ui.md「キャンバスのクリックが選ぶ階
 * 層」）。クリックで選ぶものとドラッグで掴むものの両方がここで決まる。
 *
 * `home` の直下に Box の `card`、その中に Box の `row`、その中に Text の `label` がある。
 * 隣の `login` は部品 `primary-button` のインスタンスで、キャンバスには定義の中の
 * `primary-button-label` が中身として描かれる。
 * 3 段にするのは、「artboard 直下の子」「今の選択」「いちばん内側」がすべて別の名前になる
 * ようにするため。
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
          {
            name: "card",
            type: "Box",
            children: [
              {
                name: "row",
                type: "Box",
                children: [{ name: "label", type: "Text" }],
              },
            ],
          },
          { name: "title", type: "Text" },
          { name: "login", ref: "primary-button" },
        ],
      },
    ],
  });
}

/** `label` を押したときに、押された位置から外へ辿った名前（内→外）。 */
const PressedOnLabel = ["label", "row", "card", "home"];

test("何も選んでいないときは、押した位置の artboard 直下の子になる", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), []);

  const name = DocumentSelection.nodeNameAt(
    selection,
    PressedOnLabel,
    SelectionDigs.NoDeeper,
  );

  expect(Option.unwrap(name)).toBe("card");
});

test("押した位置が今の選択の内側なら、選んでいるノードになる", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), ["row"]);

  const name = DocumentSelection.nodeNameAt(
    selection,
    PressedOnLabel,
    SelectionDigs.NoDeeper,
  );

  expect(Option.unwrap(name)).toBe("row");
});

test("別の枝を選んでいるときは、押した位置の artboard 直下の子になる", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), ["title"]);

  const name = DocumentSelection.nodeNameAt(
    selection,
    PressedOnLabel,
    SelectionDigs.NoDeeper,
  );

  expect(Option.unwrap(name)).toBe("card");
});

test("いちばん内側まで掘る押し方では、選択に関わらず押した位置のいちばん内側になる", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), ["row"]);

  const name = DocumentSelection.nodeNameAt(
    selection,
    PressedOnLabel,
    SelectionDigs.Deepest,
  );

  expect(Option.unwrap(name)).toBe("label");
});

test("artboard の背景を押したときはノードが決まらない", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), ["home"]);

  const name = DocumentSelection.nodeNameAt(
    selection,
    ["home"],
    SelectionDigs.NoDeeper,
  );

  expect(Option.isSome(name)).toBe(false);
});

test("インスタンスの中身を押したときは、いちばん内側まで掘ってもインスタンス自身で止まる", () => {
  const selection = DocumentSelection.fromNames(setupDocument(), []);

  const name = DocumentSelection.nodeNameAt(
    selection,
    ["primary-button-label", "login", "home"],
    SelectionDigs.Deepest,
  );

  expect(Option.unwrap(name)).toBe("login");
});
