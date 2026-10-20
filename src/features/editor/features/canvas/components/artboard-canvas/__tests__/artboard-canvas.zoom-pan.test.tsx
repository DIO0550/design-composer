import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  canvasSurface,
  canvasTransform,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  drag,
  holdSpace,
  movePointer,
  PointerId,
  pressPointer,
  releasePointer,
  releaseSpace,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { type PointerButton, PointerButtons } from "@/libs/dom-event";
import {
  drawnAt,
  renderCanvas,
  resizeHandleAt,
  selectionFromArtboards,
} from "./setup";

/** artboard を 1 枚だけ持つドキュメントと選択の対。ズーム / パンは中身に依存しない。 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  return selectionFromArtboards(
    [{ name: "home", width: 360, height: 240, children: [] }],
    selectedNames,
  );
}

/**
 * `home` を選んで描いた位置を決め、右辺の中央に出ている四角（掴める箇所）を返す。
 *
 * @param onResize 大きさの通知の受け口
 * @returns 右辺の中央のハンドル。四角は (460, 170) を中心に置かれる
 */
function setupRightHandle(onResize = vi.fn()): HTMLElement {
  renderCanvas({ selection: setupSelection(["home"]), onResize });
  drawnAt("home", { left: 100, top: 50, width: 360, height: 240 });
  return resizeHandleAt({ x: 1, y: 0.5 });
}

/**
 * 右辺の中央のハンドルを押し、土台の上で (+30, -20) だけ引いて離す。
 *
 * @param handle 押すハンドル（`setupRightHandle` が返したもの）
 * @param button 押すボタン。省けば主ボタン
 */
function dragFromHandle(
  handle: HTMLElement,
  button: PointerButton = PointerButtons.Primary,
): void {
  pressPointer(handle, { x: 460, y: 170 }, button);
  movePointer(canvasSurface(), { x: 490, y: 150 });
  releasePointer(canvasSurface(), { x: 490, y: 150 });
}

test("キャンバスを開いた直後は等倍で表示される", () => {
  renderCanvas({ selection: setupSelection() });

  expect(canvasTransform()).toContain("scale(1)");
});

test("中ボタンでドラッグすると中身が同じだけ移動する", () => {
  renderCanvas({ selection: setupSelection() });

  drag(
    canvasSurface(),
    { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } },
    PointerButtons.Middle,
  );

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("space を押しながらドラッグすると中身が同じだけ移動する", () => {
  renderCanvas({ selection: setupSelection() });
  holdSpace();

  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("修飾なしの左ドラッグでは中身が動かない", () => {
  renderCanvas({ selection: setupSelection() });

  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("space を離したあとの左ドラッグでは中身が動かない", () => {
  renderCanvas({ selection: setupSelection() });
  holdSpace();
  releaseSpace();

  drag(canvasSurface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("space を押しながらなら artboard の上で始めたドラッグでもキャンバスが動く", () => {
  /*
   * 見出しと、中身を掴んだ枠は `pointerdown` を止めるので、土台が bubble で待っていると
   * artboard で埋まった画面ではパンを始められなくなる（capture で取っている理由）。
   */
  renderCanvas({ selection: setupSelection() });
  holdSpace();

  drag(screen.getByRole("button", { name: "home" }), {
    from: { x: 100, y: 100 },
    to: { x: 130, y: 80 },
  });

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("space を押していなければ artboard の上で始めたドラッグではキャンバスが動かない", () => {
  renderCanvas({ selection: setupSelection() });

  pressPointer(screen.getByRole("button", { name: "home" }), {
    x: 100,
    y: 100,
  });
  movePointer(canvasSurface(), { x: 130, y: 80 });

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("ctrl を押しながらホイールを回すと中身が拡大される", () => {
  renderCanvas({ selection: setupSelection() });

  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  expect(canvasTransform()).toContain("scale(1.2)");
});

test("ズームやパンをしても選択は変わらない", () => {
  /*
   * パンは中ボタンで撃つ。左ドラッグは範囲選択になったので、そちらで撃つと
   * 「パンでは変わらない」ではなく「範囲選択で選び直された」を見ることになる。
   */
  renderCanvas({ selection: setupSelection(["home"]) });

  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");
  drag(
    canvasSurface(),
    { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } },
    PointerButtons.Middle,
  );

  expect(
    screen.getByRole("button", { name: "home" }).getAttribute("aria-current"),
  ).toBe("true");
});

test("描いてあるハンドルの上で中ボタンを押して引くと、中身が同じだけ移動する", () => {
  const handle = setupRightHandle();

  dragFromHandle(handle, PointerButtons.Middle);

  expect(canvasTransform()).toContain("translate(30px, -20px)");
});

test("描いてあるハンドルの上で中ボタンを押すと、土台がポインタを捕捉する", () => {
  /*
   * happy-dom は捕捉した要素へ move / up を送り直さないので、上の移動のテストだけでは
   * 押したハンドルのほうで捕捉していても通る。捕捉先そのものを見る。
   */
  const handle = setupRightHandle();

  pressPointer(handle, { x: 460, y: 170 }, PointerButtons.Middle);

  expect(canvasSurface().hasPointerCapture(PointerId)).toBe(true);
});

test("space を押しながら掴めるハンドルを掴んで運ぶと、大きさが通知される", () => {
  const onResize = vi.fn();
  const handle = setupRightHandle(onResize);
  holdSpace();

  pressPointer(handle, { x: 460, y: 170 });
  movePointer(screen.getByRole("button", { name: "home" }), { x: 500, y: 170 });
  releasePointer(screen.getByRole("button", { name: "home" }), {
    x: 500,
    y: 170,
  });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 400 }]),
    expect.anything(),
  );
});

test("space を押しながら掴めるハンドルを掴んで運んでも、中身は動かない", () => {
  const handle = setupRightHandle();
  holdSpace();

  dragFromHandle(handle);

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("space を押しながら右ボタンで掴めるハンドルを押して引いても、中身は動かない", () => {
  // docs/06-ui.md「パン」
  const handle = setupRightHandle();
  holdSpace();

  dragFromHandle(handle, PointerButtons.Secondary);

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("space を押しながら右ボタンで土台を押して引いても、中身は動かない", () => {
  renderCanvas({ selection: setupSelection() });
  holdSpace();

  drag(
    canvasSurface(),
    { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } },
    PointerButtons.Secondary,
  );

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});

test("space を押さずに右ボタンでハンドルを押して引いても、中身は動かない", () => {
  const handle = setupRightHandle();

  dragFromHandle(handle, PointerButtons.Secondary);

  expect(canvasTransform()).toContain("translate(0px, 0px)");
});
