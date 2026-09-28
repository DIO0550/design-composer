import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Offset } from "@/domains/unit/offset";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { CanvasPointer } from "../CanvasPointer";

/** ポインタイベントを受けて、読み取った位置をそのまま渡すだけの器。 */
function PointerHarness({
  onRead,
}: Readonly<{ onRead: (offset: Offset) => void }>) {
  return (
    <div
      data-testid="surface"
      onPointerDown={(event) => onRead(CanvasPointer.offsetOf(event))}
      onPointerMove={(event) => onRead(CanvasPointer.offsetOf(event))}
    />
  );
}

/**
 * `PointerHarness` を描く。
 *
 * @returns 読み取った位置を受け取った関数と、ポインタを当てる面
 */
function setup() {
  const read = vi.fn();
  render(<PointerHarness onRead={read} />);
  return { read, surface: screen.getByTestId("surface") };
}

test("押されたイベントからはその画面上の位置が読める", () => {
  const { read, surface } = setup();

  pressPointer(surface, { x: 120, y: 48 });

  expect(read).toHaveBeenCalledWith({ x: 120, y: 48 });
});

test("動かしたイベントからもその画面上の位置が読める", () => {
  const { read, surface } = setup();

  movePointer(surface, { x: 0, y: 300 });

  expect(read).toHaveBeenCalledWith({ x: 0, y: 300 });
});
