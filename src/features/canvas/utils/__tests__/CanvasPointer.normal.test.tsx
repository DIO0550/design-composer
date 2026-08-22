import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  movePointer,
  pressPointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import type { CanvasOffset } from "@/features/canvas/domains/canvas-view";
import { CanvasPointer } from "../CanvasPointer";

/** ポインタイベントを受けて、読み取った位置をそのまま渡すだけの器。 */
function PointerHarness({
  onRead,
}: Readonly<{ onRead: (offset: CanvasOffset) => void }>) {
  return (
    <div
      data-testid="surface"
      onPointerDown={(event) => onRead(CanvasPointer.offsetOf(event))}
      onPointerMove={(event) => onRead(CanvasPointer.offsetOf(event))}
    />
  );
}

test("押されたイベントからはその画面上の位置が読める", () => {
  const read = vi.fn();
  render(<PointerHarness onRead={read} />);

  pressPointer(screen.getByTestId("surface"), { x: 120, y: 48 });

  expect(read).toHaveBeenCalledWith({ x: 120, y: 48 });
});

test("動かしたイベントからもその画面上の位置が読める", () => {
  const read = vi.fn();
  render(<PointerHarness onRead={read} />);

  movePointer(screen.getByTestId("surface"), { x: 0, y: 300 });

  expect(read).toHaveBeenCalledWith({ x: 0, y: 300 });
});
