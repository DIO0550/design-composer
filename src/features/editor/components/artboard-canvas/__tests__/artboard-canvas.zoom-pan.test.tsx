import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
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

/**
 * キャンバスの土台でホイールを回す。
 * happy-dom の `WheelEvent` は `UIEvent` 派生で修飾キーを持たないため、
 * ctrl の有無はイベントを組み立てたあとに与える。
 */
function wheel(operation: { deltaY: number; withCtrlKey: boolean }) {
  const event = new WheelEvent("wheel", {
    deltaY: operation.deltaY,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "ctrlKey", { value: operation.withCtrlKey });
  fireEvent(screen.getByTestId("canvas-surface"), event);
}

/** キャンバスの土台をドラッグする。 */
function drag(from: { x: number; y: number }, to: { x: number; y: number }) {
  const surface = screen.getByTestId("canvas-surface");
  fireEvent.pointerDown(surface, {
    pointerId: 1,
    clientX: from.x,
    clientY: from.y,
  });
  fireEvent.pointerMove(surface, {
    pointerId: 1,
    clientX: to.x,
    clientY: to.y,
  });
  fireEvent.pointerUp(surface, { pointerId: 1, clientX: to.x, clientY: to.y });
}

test("キャンバスを開いた直後は等倍で表示される", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  expect(screen.getByText("倍率 100%")).toBeDefined();
  expect(canvasTransform()).toContain("scale(1)");
});

test("拡大すると表示倍率が上がる", async () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  expect(screen.getByText("倍率 120%")).toBeDefined();
  expect(canvasTransform()).toContain("scale(1.2)");
});

test("縮小すると表示倍率が下がる", async () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "縮小" }));

  expect(screen.getByText("倍率 83%")).toBeDefined();
});

test("等倍に戻すと 100% に戻る", async () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  await userEvent.click(screen.getByRole("button", { name: "等倍に戻す" }));

  expect(screen.getByText("倍率 100%")).toBeDefined();
});

test("縮小を繰り返しても下限より小さくならない", async () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);
  const zoomOut = screen.getByRole("button", { name: "縮小" });

  for (const _ of Array.from({ length: 20 })) {
    await userEvent.click(zoomOut);
  }

  expect(screen.getByText("倍率 10%")).toBeDefined();
});

test("キャンバスをドラッグすると中身が同じだけ移動する", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  drag({ x: 100, y: 100 }, { x: 130, y: 80 });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("ドラッグを終えたあとのポインタ移動では中身が動かない", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);
  drag({ x: 100, y: 100 }, { x: 130, y: 80 });

  fireEvent.pointerMove(screen.getByTestId("canvas-surface"), {
    pointerId: 1,
    clientX: 400,
    clientY: 400,
  });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("artboard の上で始めたドラッグではキャンバスが動かない", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);
  const artboard = screen.getByRole("button", { name: "home" });

  fireEvent.pointerDown(artboard, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(screen.getByTestId("canvas-surface"), {
    pointerId: 1,
    clientX: 130,
    clientY: 80,
  });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("ctrl を押しながらホイールを回すと拡大する", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  wheel({ deltaY: -100, withCtrlKey: true });

  expect(screen.getByText("倍率 120%")).toBeDefined();
});

test("ホイールだけを回すとスクロール方向へ移動する", () => {
  render(<ArtboardCanvas state={setupState()} onSelect={vi.fn()} />);

  wheel({ deltaY: 40, withCtrlKey: false });

  expect(canvasTransform()).toContain("translate(0px, -40px)");
});

test("ズームやパンをしても選択は変わらない", async () => {
  const state = EditorState.select(setupState(), "home");
  render(<ArtboardCanvas state={state} onSelect={vi.fn()} />);

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));
  drag({ x: 100, y: 100 }, { x: 130, y: 80 });

  expect(
    screen.getByRole("button", { name: "home" }).getAttribute("aria-current"),
  ).toBe("true");
});
