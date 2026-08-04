import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  drag,
  movePointer,
  pressPointer,
  wheel,
} from "@/features/editor/__tests__/canvas-gesture";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardCanvas } from "../index";

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
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  expect(screen.getByText("倍率 100%")).toBeDefined();
  expect(canvasTransform()).toContain("scale(1)");
});

test("拡大すると表示倍率が上がる", async () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  expect(screen.getByText("倍率 120%")).toBeDefined();
  expect(canvasTransform()).toContain("scale(1.2)");
});

test("縮小すると表示倍率が下がる", async () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "縮小" }));

  expect(screen.getByText("倍率 83%")).toBeDefined();
});

test("等倍に戻すと 100% に戻る", async () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  await userEvent.click(screen.getByRole("button", { name: "等倍に戻す" }));

  expect(screen.getByText("倍率 100%")).toBeDefined();
});

test("縮小を繰り返しても下限より小さくならない", async () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );
  const zoomOut = screen.getByRole("button", { name: "縮小" });

  for (const _ of Array.from({ length: 20 })) {
    await userEvent.click(zoomOut);
  }

  expect(screen.getByText("倍率 10%")).toBeDefined();
});

test("キャンバスをドラッグすると中身が同じだけ移動する", () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("artboard の上で始めたドラッグではキャンバスが動かない", () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  pressPointer(screen.getByRole("button", { name: "home" }), {
    x: 100,
    y: 100,
  });
  movePointer(canvasSurface(), { x: 130, y: 80 });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("ctrl を押しながらホイールを回すと拡大する", () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  expect(screen.getByText("倍率 120%")).toBeDefined();
});

test("ズームやパンをしても選択は変わらない", async () => {
  const state = EditorState.select(setupState(), "home");
  render(
    <ArtboardCanvas
      state={state}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));
  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(
    screen.getByRole("button", { name: "home" }).getAttribute("aria-current"),
  ).toBe("true");
});
