import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  drag,
  movePointer,
  pressPointer,
  wheel,
} from "@/features/editor/__tests__/canvas-gesture";
import { EditorState } from "@/features/editor/domains/editor-state";
import { renderCanvas } from "./setup";

/** artboard を 1 枚だけ持つエディタ状態。ズーム / パンは中身に依存しない。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
      components: DocumentTemplate.DEFAULT.components,
      artboards: [{ name: "home", width: 360, height: 240, children: [] }],
    }),
  );
}

/** キャンバスの中身に効いている変形（ズーム / パンの結果）。 */
function canvasTransform(): string {
  return screen.getByTestId("canvas-content").getAttribute("style") ?? "";
}

/** ズーム / パンの操作を受け取るキャンバスの土台。 */
function canvasSurface(): Element {
  return screen.getByTestId("canvas-surface");
}

test("キャンバスを開いた直後は等倍で表示される", () => {
  renderCanvas({ state: setupState() });

  expect(canvasTransform()).toContain("scale(1)");
});

test("キャンバスをドラッグすると中身が同じだけ移動する", () => {
  renderCanvas({ state: setupState() });

  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("artboard の上で始めたドラッグではキャンバスが動かない", () => {
  renderCanvas({ state: setupState() });

  pressPointer(screen.getByRole("button", { name: "home" }), {
    x: 100,
    y: 100,
  });
  movePointer(canvasSurface(), { x: 130, y: 80 });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("ctrl を押しながらホイールを回すと中身が拡大される", () => {
  renderCanvas({ state: setupState() });

  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  expect(canvasTransform()).toContain("scale(1.2)");
});

test("ズームやパンをしても選択は変わらない", () => {
  renderCanvas({ state: EditorState.select(setupState(), "home") });

  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");
  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(
    screen.getByRole("button", { name: "home" }).getAttribute("aria-current"),
  ).toBe("true");
});
