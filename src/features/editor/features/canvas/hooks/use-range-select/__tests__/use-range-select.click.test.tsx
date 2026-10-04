import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import { harnessOutput } from "@/components/__tests__/harness-output";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { artboardFrame, frameNode, renderHarness } from "./setup";

/** 枠の代わりのボタンを押して (90, 90) まで引き、そこで離す。 */
function drawRangeAndRelease(): void {
  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 90, y: 90 });
  releasePointer(canvasSurface(), { x: 90, y: 90 });
}

test("範囲を引いて離した直後の click は、中身へ届かない", () => {
  renderHarness();

  drawRangeAndRelease();
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("click は届いていない");
});

test("範囲を引いていないときの click は、そのまま中身へ届く", () => {
  renderHarness();

  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("直後の click を飲み込んだあとは、次の click が中身へ届く", () => {
  renderHarness();

  drawRangeAndRelease();
  fireEvent.click(artboardFrame());
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("範囲を引いて離したあと click が来ないまま中身を押すと、その click は中身へ届く", () => {
  renderHarness();

  drawRangeAndRelease();
  pressPointer(frameNode(), { x: 120, y: 120 });
  releasePointer(frameNode(), { x: 120, y: 120 });
  fireEvent.click(frameNode());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("範囲を引いて離したあとに捕捉が外れても、直後の click は中身へ届かない", () => {
  renderHarness();

  drawRangeAndRelease();
  fireEvent.lostPointerCapture(canvasSurface());
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("click は届いていない");
});
