import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { Props } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { propNamesOf } from "./setup";

function setupBoxState(props: Props): EditorState {
  return EditorState.select(
    EditorState.create(
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
    ),
    "box",
  );
}

test("サイズのモードが fixed のときだけ長さのコントロールが出る", () => {
  expect(propNamesOf(setupBoxState({ widthMode: "fixed" }))).toContain("width");
});

test("サイズのモードが hug なら長さのコントロールは出ない", () => {
  expect(propNamesOf(setupBoxState({ widthMode: "hug" }))).not.toContain(
    "width",
  );
});

test("サイズのモードが未指定なら既定の hug として扱われ、長さのコントロールは出ない", () => {
  expect(propNamesOf(setupBoxState({}))).not.toContain("width");
});

test("条件を満たす prop だけが出るので、縦のサイズは横のモードに影響されない", () => {
  const names = propNamesOf(setupBoxState({ widthMode: "fixed" }));

  expect(names).toContain("width");
  expect(names).not.toContain("height");
});
