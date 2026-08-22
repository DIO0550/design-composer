import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import type { Props } from "@/domains/node";
import { propNamesOf } from "./setup";

function setupBoxSelection(props: Props): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "box", type: "Box", props }],
        },
      ],
    }),
    ["box"],
  );
}

test("サイズのモードが fixed のときだけ長さのコントロールが出る", () => {
  expect(propNamesOf(setupBoxSelection({ widthMode: "fixed" }))).toContain(
    "width",
  );
});

test("サイズのモードが hug なら長さのコントロールは出ない", () => {
  expect(propNamesOf(setupBoxSelection({ widthMode: "hug" }))).not.toContain(
    "width",
  );
});

test("サイズのモードが未指定なら既定の hug として扱われ、長さのコントロールは出ない", () => {
  expect(propNamesOf(setupBoxSelection({}))).not.toContain("width");
});

test("条件を満たす prop だけが出るので、縦のサイズは横のモードに影響されない", () => {
  const names = propNamesOf(setupBoxSelection({ widthMode: "fixed" }));

  expect(names).toContain("width");
  expect(names).not.toContain("height");
});
