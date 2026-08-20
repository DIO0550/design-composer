import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { Componentization } from "../index";

/** 選択の対象になりうる 3 つ（artboard / プリミティブ / インスタンス）を 1 枚に置く。 */
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
          { name: "home-panel", type: "Box", children: [] },
          { name: "home-login", ref: "primary-button" },
        ],
      },
    ],
  });
}

test("プリミティブのノードを選んでいるとそれを元に部品を作れる", () => {
  expect(
    Componentization.forSelection(setupDocument(), Option.some("home-panel")),
  ).toEqual({
    kind: "ready",
    sourceName: "home-panel",
  });
});

test("インスタンスを選んでいると部品を作れない", () => {
  expect(
    Componentization.forSelection(setupDocument(), Option.some("home-login")),
  ).toEqual({ kind: "instance" });
});

test("artboard を選んでいると部品を作れない", () => {
  expect(
    Componentization.forSelection(setupDocument(), Option.some("home")),
  ).toEqual({ kind: "artboard" });
});

test("何も選んでいないと部品を作れない", () => {
  expect(Componentization.forSelection(setupDocument(), Option.none)).toEqual({
    kind: "unselected",
  });
});
