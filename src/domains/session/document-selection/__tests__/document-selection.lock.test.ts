import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { Option } from "@/utils/Option";

/**
 * キャンバスで押された位置から決まるノードのうち、ロックが効くもの（docs/03「ロック」/
 * docs/06-ui.md「キャンバスのクリックが選ぶ階層」）。
 *
 * `home` の直下に Box の `card`、その中にロックした Box の `row`、その中に Text の `label`。
 * 隣の `sealed` はロックした Box で、中に `sealed-title` がある。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
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
                props: { locking: "locked" },
                children: [{ name: "label", type: "Text" }],
              },
            ],
          },
          {
            name: "sealed",
            type: "Box",
            props: { locking: "locked" },
            children: [{ name: "sealed-title", type: "Text" }],
          },
        ],
      },
    ],
  });
}

test("ロックした Box の中を ⌘ で押すと、そのすぐ外側のロックしていないノードを選ぶ", () => {
  const name = DocumentSelection.nodeNameAt(
    DocumentSelection.fromNames(setupDocument(), []),
    ["label", "row", "card", "home"],
    SelectionDigs.Deepest,
  );

  expect(name).toEqual(Option.some("card"));
});

test("artboard 直下のロックした Box の中を押すと、Box もその中身も選ばない", () => {
  const name = DocumentSelection.nodeNameAt(
    DocumentSelection.fromNames(setupDocument(), []),
    ["sealed-title", "sealed", "home"],
    SelectionDigs.Deepest,
  );

  expect(name).toEqual(Option.none);
});
