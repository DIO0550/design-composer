import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  drag,
  movePointer,
  pressPointer,
  wheel,
} from "@/features/editor/__tests__/canvas-gesture";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { useCanvasView } from "../index";

/**
 * フックを DOM へ繋いだだけの器。
 * ホイールの登録先とポインタの受け口を与え、フックが返す view を読めるようにする
 * （キャンバスの見た目はここでは扱わない。それは components/artboard-canvas の責務）。
 */
function CanvasViewHarness() {
  const { view, surfaceRef, panHandlers, zoomIn, zoomOut, reset } =
    useCanvasView();

  return (
    <>
      <div data-testid="surface" ref={surfaceRef} {...panHandlers} />
      <p data-testid="transform">{CanvasView.transform(view)}</p>
      <p data-testid="scale-percent">{CanvasView.scalePercent(view)}</p>
      <button type="button" onClick={zoomIn}>
        拡大
      </button>
      <button type="button" onClick={zoomOut}>
        縮小
      </button>
      <button type="button" onClick={reset}>
        リセット
      </button>
    </>
  );
}

function surface(): Element {
  return screen.getByTestId("surface");
}

function transform(): string {
  return screen.getByTestId("transform").textContent ?? "";
}

function scalePercent(): string {
  return screen.getByTestId("scale-percent").textContent ?? "";
}

test("使い始めは等倍で原点にある", () => {
  render(<CanvasViewHarness />);

  expect(transform()).toBe("translate(0px, 0px) scale(1)");
});

test("拡大を求めると倍率が上がる", async () => {
  render(<CanvasViewHarness />);

  await userEvent.click(screen.getByRole("button", { name: "拡大" }));

  expect(scalePercent()).toBe("120");
});

test("縮小を求めると倍率が下がる", async () => {
  render(<CanvasViewHarness />);

  await userEvent.click(screen.getByRole("button", { name: "縮小" }));

  expect(scalePercent()).toBe("83");
});

test("ドラッグするとポインタの移動量だけ位置が動く", () => {
  render(<CanvasViewHarness />);

  drag(surface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  expect(transform()).toContain("translate(30px, -20px)");
});

test("ドラッグ中に何度も動かすと移動量が積み上がる", () => {
  render(<CanvasViewHarness />);

  pressPointer(surface(), { x: 100, y: 100 });
  movePointer(surface(), { x: 130, y: 80 });
  movePointer(surface(), { x: 140, y: 90 });

  expect(transform()).toContain("translate(40px, -10px)");
});

test("押していないときのポインタ移動では位置が動かない", () => {
  render(<CanvasViewHarness />);

  movePointer(surface(), { x: 130, y: 80 });

  expect(transform()).toContain("translate(0px, 0px)");
});

test("ドラッグを終えたあとのポインタ移動では位置が動かない", () => {
  render(<CanvasViewHarness />);
  drag(surface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  movePointer(surface(), { x: 400, y: 400 });

  expect(transform()).toContain("translate(30px, -20px)");
});

test("ctrl を押しながらホイールを上へ回すと拡大する", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 0, y: -100 }, "ctrl");

  expect(scalePercent()).toBe("120");
});

test("ctrl を押しながらホイールを下へ回すと縮小する", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 0, y: 100 }, "ctrl");

  expect(scalePercent()).toBe("83");
});

test("⌘ を押しながらホイールを回しても拡大する", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 0, y: -100 }, "meta");

  expect(scalePercent()).toBe("120");
});

test("修飾キーなしでホイールを回すとスクロール方向へ移動する", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 0, y: 40 }, "none");

  expect(transform()).toContain("translate(0px, -40px)");
});

test("修飾キーなしの横方向のホイールでも移動する", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 30, y: 0 }, "none");

  expect(transform()).toContain("translate(-30px, 0px)");
});

test("修飾キーなしのホイールでは倍率は変わらない", () => {
  render(<CanvasViewHarness />);

  wheel(surface(), { x: 0, y: 40 }, "none");

  expect(scalePercent()).toBe("100");
});

test("リセットすると倍率と位置の両方が初期状態に戻る", async () => {
  render(<CanvasViewHarness />);
  await userEvent.click(screen.getByRole("button", { name: "拡大" }));
  drag(surface(), { from: { x: 100, y: 100 }, to: { x: 130, y: 80 } });

  await userEvent.click(screen.getByRole("button", { name: "リセット" }));

  expect(transform()).toBe("translate(0px, 0px) scale(1)");
});
